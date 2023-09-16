 
let router = {}; 

const passwordClass = require("../password_hash");

let passwordValidator = new passwordClass.PasswordHash();

router._maximumFailUserLoginAttempts = 4; //maximum fail login attempts
router._blockingTime = BigInt( (1000 * 60 * 2) ) //3 minutes - blocking time since the maximum count of fail logins been achived.When a period has been ellapsed - user unlocked
router._adminsBlockingCode = 30000; // ADMIN code for blocking a user. It`s only constant for recognize admin`s blocking. 
                                   //It can be more that maximum fail attempts threshold.
///POST
router.login =  async  (req, res)=>{
    try{
                let userinfo , sessionId;
            if(Boolean(req.body.email) & Boolean(req.body.password)){
                //---1) is a user exists?
                userinfo  = await router.rdbmsLayer.getUserByEmail(req.body.email);
                if (!userinfo) {
                    router._respondWithJsonData(res,{err:"Bad credentials!"}, 401);
                    return false;
                } 
                //--2) Has a user been blocked by Admin?
                if( userinfo.fail_a === router._adminsBlockingCode ) {
                     router._respondWithJsonData(res,{err:"You are blocked!Please contact to Admin"}, 400);
                    return;
                }
                //---3) Has maximum fail login attempts count been achieved?
                if (userinfo.fail_a > router._maximumFailUserLoginAttempts) {
                    // has a blocktime been ellapsed?
                    if( ( BigInt(userinfo.fail_date) + router._blockingTime ) > BigInt(Date.now()) ) {
                        //when not - continue blocking
                        res.statusCode = 403;
                        res.end();
                        return;
                    } 
                        //when the blocktime has been ellapsed - unclock a user
                            await router.rdbmsLayer.clearUserBlocking(userinfo.user_id)
                }
                //---4) Is a pasword valid?
                if(! await passwordValidator.verifyPassword(req.body.password, userinfo.passw, userinfo.salt)){
                    //when a password is incorrect - increment fail attempts
                    await router.rdbmsLayer.incrementFailLogins(userinfo.user_id);
                     router._respondWithJsonData(res,{err:"Bad credentials!"}, 404);
                    return false;
                }
                //---5) Generate a new session
                sessionId = await router.sessionLayer.createNewSession(userinfo.user_id);
                 router._respondWithJsonData(res, {token: sessionId}, 201);
            } else {
                res.statusCode = 400;
                res.end();
            }
    } catch (e){
         router._respondWithJsonData(res,{err: e.toString()}, 500);
        return;
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