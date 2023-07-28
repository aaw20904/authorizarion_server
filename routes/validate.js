const express = require("express");

let router = express.Router();
/**The object router must have injected property 'sessions' */
router.post("/",async (req, res)=>{
    // Regular expression to match Base64url format
  const base64urlRegExp = /^[A-Za-z0-9_-]*$/;
 // 1) Is a token exists?
  if (! req.headers.authorization) {
    res.sendStatus(403);
    return
  }
  // 2) Is the token Bearer?
  let token = req.headers.authorization;
  if (token.startsWith('Bearer ') ){
      token = token.substring(7)
  }
  //2.1) Is a data in Base64?
  if(! base64urlRegExp.test(token)) {
    res.sendStatus(403);
    return
  }
  //2.2) Is length correct?
  if(token.length !== 375){
    res.sendStatus(403);
    return
  }
  
  // 3) validate 
  let userInfo = await router.sessions.verifyUserSession(token);
  if (!userInfo) {
    res.sendStatus(403);
    return;
  } else {
    res.status(200).json({...userInfo});
  }
   
})

router.post("/logoff", async(req, res)=>{
   // Regular expression to match Base64url format
   const base64urlRegExp = /^[A-Za-z0-9_-]*$/;
   // 1) Is a token exists?
    if (! req.headers.authorization) {
      res.sendStatus(403);
      return
    }
    // 2) Is the token Bearer?
    let token = req.headers.authorization;
    if (token.startsWith('Bearer ') ){
        token = token.substring(7)
    }
    //2.1) Is a data in Base64?
    if(! base64urlRegExp.test(token)) {
      res.sendStatus(403);
      return
    }
    //2.2) Is length correct?
    if(token.length !== 375){
      res.sendStatus(403);
      return
    }

    //3)try to remove
    if (await router.sessions.removeSession(token)){
      res.sendStatus(204)
    } else{
      res.sendStatus(404);
    }
})

module.exports={router}