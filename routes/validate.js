const express = require("express");

let router = express.Router();
/**The object router must have injected property 'sessions' */
router.post("/",async (req, res)=>{
    
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
  // 2) validate 
  let userInfo = await router.sessions.verifyUserSession(token);
  if (!userInfo) {
    res.sendStatus(403);
    return;
  } else {
    res.status(200).json({...userInfo});
  }
   
})

module.exports={router}