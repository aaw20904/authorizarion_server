 
let router = {}; 
let nodemailer = require("nodemailer");
const ejs = require('ejs');
const querystring = require('querystring');
const crypto =require("crypto");
const psw = require("../password_hash");
const passwordHashing = new psw.PasswordHash();

const fs = require("fs");
const { request } = require("http");
const { resolve } = require("path");

router._mailtemplate = fs.readFileSync("./views/mailregister.ejs",{encoding:"utf-8"});
router._redirectAddrWhenSucc = "https://www.example.com"

router._cryptoKeys = {
  publicKey: fs.readFileSync("./public_key.pem",{encoding:"utf-8"}),
  privateKey: fs.readFileSync("./private_key.pem",{encoding:"utf-8"}),
  password: '32768',
}

router._getLocalIp=() => {
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const entry of iface) {
      if (!entry.internal && entry.family === "IPv4") {
        router._localIp = entry.address;
        return true;
      }
    }
  }
  router._localIp="localhost"; 
  return false;
}

/****options of SMTP - i`s only options of your email service.This mail will be used for register of users  */
router._workMail ={ host:"smtp.gmail.com", user:'kozakizdona@gmail.com', password:"lcopwvgmqcwsqpxy", backURL:`http://13.41.172.50:8080/register/register_finish?`};

router._sendRegistrationMsgToMail = async (par="b64urlString", n_user="")=>{
            // Create a transporter
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
                service: "gmail",
                host: router._workMail.host,
                port: 587,
                secure:true,
                auth: {
                user: router._workMail.user ,
                pass: router._workMail.password,
            },
    });

   
    //generate html content
    const htmlMessage = ejs.render(router._mailtemplate, {user:n_user,time:new Date().toLocaleTimeString(), link:`${router._workMail.backURL}data=${par}`});
      // Set up email data
      const mailOptions = {
        from: 'kozakizdona@gmail.com',
        to:'andrej_chud@meta.ua',
        subject: 'Registration',
        text: 'Marry had a little lamb',
        html:htmlMessage
    };
        // Send the email
      
     return new Promise((resolve, reject) => {
                        transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                 reject(error)
                                } else {
                                 resolve({msg:'Email sent successfully:', info:info.response});
                                }
                        });
      });
}

router.testing =  async(req, res)=>{
    try{
        let result = await router._sendRegistrationMsgToMail({code:56415,user_name:"Wasya"});
         router._respondWithJsonData(res, result, 200);
       
    }catch(e){
        router._respondWithJsonData(res,{err:e},500);
 
    }

}

//POST
router.begin_registration =  async function (req, res, next) {
  
  //get data from request 
 if (Boolean(req.body.email) & Boolean(req.body.name) & Boolean(req.body.password) &  Boolean(req.body.phone)) {
    //Checking- is the email exists in the database
       if (await router.rdbmsLayer.getUserByEmail(req.body.email)) {
          router._respondWithJsonData(res,{error:"exists"},409);
   
           return false;
      }
      //generate user info 
      let userRegistrationInfo  = {
        ...req.body,
        exp: Date.now()+(10*60000) //5 min expiration time
      }
      //converting to string and encrypting
      let jsonString = JSON.stringify(userRegistrationInfo);
      let bufferOfData = Buffer.from(jsonString)
      let encryptedData = crypto.publicEncrypt(router._cryptoKeys.publicKey, bufferOfData);

      //convert to base64url format
      let b64urlEncryptedData = encryptedData.toString("base64url"); 
      //send a letter
      try {
        //11.09  IMPLEMENT EMAIL SENDING AS EXTERN SERVICE! await router._sendRegistrationMsgToMail(b64urlEncryptedData, req.body.name);
            router._respondWithJsonData(res, {confirm:b64urlEncryptedData}, 200);
      } catch (err) {
            router._respondWithJsonData(res, err, 500);
     
          return false;
      }
      //when success
         //11.09 router._respondWithJsonData(res,{...req.body},200);
        
 } else {
    res.statusCode = 400;
    res.end('');
    return false;
  }
}
  //GET
router.register_finish = async (req,res)=>{
  //example for verifying:
  //let resultat = await passwordHashing.verifyPassword ("voooooova", hashedPassword.key, hashedPassword.salt);
  //is there a parameter?
  let decrypted;
  if(req.body){
    //cnverting to Buffer
    let binlake = Buffer.from(req.body.data,'base64url'); 
    //decrypt
     try{
       decrypted = crypto.privateDecrypt( {
                                            key: router._cryptoKeys.privateKey,
                                            passphrase: router._cryptoKeys.password
                                          } , binlake);
     } catch(e){
        router._respondWithJsonData(res,{msg:"wrong or deprecated data!"},403);
        
        return false;
     }

     //restore an object:
     let userInformation = JSON.parse(decrypted);
     //is the token expired?
     if (userInformation.exp < Date.now()) {
        router._respondWithJsonData(res,{msg:"wrong or deprecated data!"},403);
    
        return false;
     }
     //hashing password:
     let hashedPassword = await passwordHashing.hashingPassword (userInformation.password);
     //create a new user
     try {
        await router.rdbmsLayer.createNewUser({
            name: userInformation.name,
            salt: hashedPassword.salt,
            password: hashedPassword.key,
            email: userInformation.email,
            phone: userInformation.phone,
            picture: 0,
        })
     } catch (e) {
      if(e.alrEx){
          res.statusCode = 409;
          res.end('');
          return;
      }else{
         router._respondWithJsonData(res,{time:new Date().toLocaleTimeString(), err:"Server error!"},500);
          
          return;
      }
      
     }
     // when the registration is successfull - redirect 
    //11.09   res.writeHead(302, { 'Location': router._redirectAddrWhenSucc });
      router._respondWithJsonData(res,{result:"Created"},201);
    //11.09  res.end();

  } else {
    router._respondWithJsonData(res, {msg:"wrong or deprecated data!"}, 403);
    return false;
  }

}
///method to sending 
router._respondWithJsonData =   (res, obj, statusCode) => {
   
       let str = JSON.stringify(obj);
        res.setHeader("Content-Type","application/json");
        res.setHeader("Content-Length", str.length);
        res.statusCode = statusCode;
        res.end(str);
 
}

module.exports = {router}