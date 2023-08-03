

let router = {};// express.Router();
/**The object router must have injected property 'sessions' */
//POST
router.validate = async (req, res)=>{
    // Regular expression to match Base64url format
  const base64urlRegExp = /^[A-Za-z0-9_-]*$/;
 // 1) Is a token exists?
  if (! req.headers.authorization) {
    res.statusCode = 403;
      res.end();
    return
  }
  // 2) Is the token Bearer?
  let token = req.headers.authorization;
  if (token.startsWith('Bearer ') ){
      token = token.substring(7)
  }
  //2.1) Is a data in Base64?
  if(! base64urlRegExp.test(token)) {
    res.statusCode = 403;
      res.end();
    return
  }
  //2.2) Is length correct?
  if(token.length !== 375){
    res.statusCode = 403;
      res.end();
    return
  }
  
  // 3) validate 
  let userInfo = await router.sessions.verifyUserSession(token);
  if (!userInfo) {
    res.statusCode = 403;
      res.end();
    return;
  } else {
    router._respondWithJsonData(res,{...userInfo},200);
  
  }
   
}
//POST
router.logoff =  async(req, res)=>{
   // Regular expression to match Base64url format
   const base64urlRegExp = /^[A-Za-z0-9_-]*$/;
   // 1) Is a token exists?
    if (! req.headers.authorization) {
      res.statusCode = 403;
      res.end();
      return
    }
    // 2) Is the token Bearer?
    let token = req.headers.authorization;
    if (token.startsWith('Bearer ') ){
        token = token.substring(7)
    }
    //2.1) Is a data in Base64?
    if(! base64urlRegExp.test(token)) {
     res.statusCode = 403;
      res.end();
      return
    }
    //2.2) Is length correct?
    if(token.length !== 375){
      res.statusCode = 403;
      res.end();
      return
    }

    //3)try to remove
    if (await router.sessions.removeSession(token)){
      res.statusCode =  204;
      res.end();
    } else{
      res.statusCode = 404;
      res.end();
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

module.exports={router}