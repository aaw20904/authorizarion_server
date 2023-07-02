const express = require("express");
let router = express.Router();

const passwordClass = require("../password_hash");

let passwordValidator = new passwordClass.PasswordHash();

router._maximumFailUserLoginAttempts = 3; //maximum fail login attempts
router._blockingTime = BigInt( (1000 * 60 * 3) ) //3 minutes - blocking time since the maximum count of fail logins been achived
router._adminsBlockingCode = 30000;// ADMIN code for blocking a user.It`s only code for recognize. It can be more that maximum fail attempts threshold.

router.post('/', async (req, res)=>{
    try{
                let userinfo , sessionId;
            if(Boolean(req.body.email) & Boolean(req.body.password)){
                //---1) is a user exists?
                userinfo  = await router.rdbmsLayer.getUserByEmail(req.body.email);
                if (!userinfo) {
                    res.status(404).json({err:"Bad credentials!"});
                    return false;
                } 
                //--2) Has a user been blocked by Admin?
                if( userinfo.fail_a === router._adminsBlockingCode ) {
                    res.status(400).json({err:"You are blocked!Please contact to Admin"});
                    return;
                }
                //---3) Has maximum fail login attempts count been achieved?
                if (userinfo.fail_a > router._maximumFailUserLoginAttempts) {
                    // has a blocktime been ellapsed?
                    if( ( BigInt(userinfo.fail_date) + router._blockingTime ) > BigInt(Date.now()) ) {
                        //when not - continue blocking
                        res.sendStatus(403);
                        return;
                    } 
                        //when the blocktime has been ellapsed - unclock a user
                            await router.rdbmsLayer.clearUserBlocking(userinfo.user_id)
                }
                //---4) Is a pasword valid?
                if(! await passwordValidator.verifyPassword(req.body.password, userinfo.passw, userinfo.salt)){
                    //when a password is incorrect - increment fail attempts
                    await router.rdbmsLayer.incrementFailLogins(userinfo.user_id);
                    res.status(404).json({err:"Bad credentials!"});
                    return false;
                }
                //---5) Generate a new session
                sessionId = await router.sessionLayer.createNewSession(userinfo.user_id);
                res.status(201).json({token:sessionId});
            } else {
                res.sendStatus(400);
            }
    } catch (e){
        res.status(500).end(e.toString());
        return;
    }

   

})


module.exports={router}