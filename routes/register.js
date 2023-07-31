const express = require("express");
let router = express.Router();
let nodemailer = require("nodemailer");
const ejs = require('ejs');
const querystring = require('querystring');
const crypto =require("crypto");
const psw = require("../password_hash");
const passwordHashing = new psw.PasswordHash();

const fs = require("fs");
const { request } = require("http");

router._mailtemplate = fs.readFileSync("./views/mailregister.ejs",{encoding:"utf-8"});
router._redirectAddrWhenSucc = "https://www.example.com"

router._cryptoKeys = {
  publicKey: fs.readFileSync("./public_key.pem",{encoding:"utf-8"}),
  privateKey: fs.readFileSync("./private_key.pem",{encoding:"utf-8"}),
  password: '32768',
}


/****options of SMTP - i`s only options of your email service.This mail will be used for register of users  */
router._workMail ={ host:"smtp.gmail.com", user:'kozakizdona@gmail.com', password:"lcopwvgmqcwsqpxy", backURL:'http://localhost:8080/register/register_finish?'};

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

router.get("/test", async(req,res)=>{
    try{
        let result = await router._sendRegistrationMsgToMail({code:56415,user_name:"Wasya"});
        res.status(200).json(result)
    }catch(e){
        res.status(500).json({err:e});
    }

})


router.post("/begin_registration", async function (req, res, next) {
  console.log(router._256);
  //get data from request 
 if (Boolean(req.body.email) & Boolean(req.body.name) & Boolean(req.body.password) &  Boolean(req.body.phone)) {
    //Checking- is the email exists in the database
       if (await router.rdbmsLayer.getUserByEmail(req.body.email)) {
           res.status(409).json({error:"exists"});
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
        await router._sendRegistrationMsgToMail(b64urlEncryptedData, req.body.name);
      } catch(err) {
        res.status(500).json(err);
        return false;
      }
      //when success
      res.status(200).json({ ...req.body});

 } else {
    res.status(400).send('');
    return false;
  }
})

router.get("/register_finish",async (req,res)=>{
  //example for verifying:
  //let resultat = await passwordHashing.verifyPassword ("voooooova", hashedPassword.key, hashedPassword.salt);
  //is there a parameter?
  let decrypted;
  if(req.query.data){
    //cnverting to Buffer
    let binlake = Buffer.from(req.query.data,'base64url'); 
    //decrypt
     try{
       decrypted = crypto.privateDecrypt( {
                                            key: router._cryptoKeys.privateKey,
                                            passphrase: router._cryptoKeys.password
                                          } , binlake);
     } catch(e){
        res.status(403).json({msg:"wrong or deprecated data!"});
        return false;
     }

     //restore an object:
     let userInformation = JSON.parse(decrypted);
     //is the token expired?
   /*  if (userInformation.exp < Date.now()){
        res.status(403).json({msg:"wrong or deprecated data!"});
        return false;
     }*/
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
        res.sendStatus(409);
        return;
      }else{
        res.status(500).render("serverfault",{time:new Date().toLocaleTimeString()});
        return;
      }
      
     }
     // when the registration is successfull - redirect 
     res.redirect(router._redirectAddrWhenSucc);

  } else {
    res.status(403).json({msg:"wrong or deprecated data!"});
    return false;
  }

})

module.exports = {router}