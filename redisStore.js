const redis = require('redis');
const util = require('util');
/*


█▀ ▀█▀ ▄▀█ █▀█ ▀█▀   █▀█ █▀▀ █▀▄ █ █▀   █▀ █▀▀ █▀█ █░█ █▀▀ █▀█   █▀▄▀█ ▄▀█ █▄░█ █░█ ▄▀█ █░░ █░░ █▄█ █
▄█ ░█░ █▀█ █▀▄ ░█░   █▀▄ ██▄ █▄▀ █ ▄█   ▄█ ██▄ █▀▄ ▀▄▀ ██▄ █▀▄   █░▀░█ █▀█ █░▀█ █▄█ █▀█ █▄▄ █▄▄ ░█░ ▄
*/

/**
 * THe maximum lifetime of stored session defines explicity when session
 * created: in the method createUSerSession() by the parameter "expired" in milliSecs
 */
class StorageSessioonsOnRedis{
    #client;
    #rdbms;
    #convertUserKey;
    #convertSessionKey;
  
    #b64stringToObj;
    #objToB64String;

    constructor() {
    
        this.#client =  redis.createClient();
        this.#client.on('error', err => console.log('Redis Client Error', err));

        this.#convertSessionKey = ({hi_p, lo_p})=>{
            const buffer = Buffer.allocUnsafe(16);
            buffer.writeBigInt64BE(BigInt(lo_p));
            buffer.writeBigInt64BE(BigInt(hi_p), 8);
            return buffer;
        }
        
        /*{
            let bufHi, bufLo, res;
            bufHi = Buffer.allocUnsafe(8);
            bufLo = Buffer.allocUnsafe(8);
            bufHi.writeBigUint64BE(hi_p);
            bufLo.writeBigUint64BE(lo_p);
            res = Buffer.concat([bufHi,bufLo]);
            return res.toString("base64");
        }*/



        this.#convertUserKey = (user_id)=>{
           
            const buffer = Buffer.allocUnsafe(8);
            buffer.writeBigInt64BE(BigInt(user_id));
            return buffer;
        
        }
        
        /* (user_id)=>{
            if (typeof value !== 'bigint') {
                 user_id = BigInt(user_id);
            }
           let bufK = Buffer.allocUnsafe(8);
            bufK.writeBigUint64BE(user_id);
            return bufK.toString('base64');
        }*/

        this.#objToB64String = (inp={})=>{
                let serilized = util.inspect(inp, { compact: true, breakLength: Infinity });
                let bfr = Buffer.from(serilized);
                return bfr.toString('base64');
        }

        this.#b64stringToObj = (str) =>{
             let bf = Buffer.from(str,'base64');
            let serializedData = bf.toString('utf8');
            return  eval(`(${serializedData})`);
        }

      
    }
     /***MUST be call first! */
       async init(){
        await this.#client.connect();
       }
 /**must be call when server turn off */
       async deInit(){
        await this.#client.disconnect();
       }
/**create a session with lifetime value that has been received as constructor arg */
/**
 
█▀▀ █▀█ █▀▀ ▄▀█ ▀█▀ █▀▀   █░█ █▀ █▀▀ █▀█   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█
█▄▄ █▀▄ ██▄ █▀█ ░█░ ██▄   █▄█ ▄█ ██▄ █▀▄   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█
 */
        async createUserSession ({
            hi_p = 1/**8 Bytes */,
            lo_p = 2/**8 bytes */,
            user_id = 3 /**8 bytes */, 
            expired = 8 /*8 bytes. Maximum non-changable (when a session already exists) lifetime in milliSec of a session.Whwn expired - session has ben removed by Redis immediately*/,
            priv_k = 0 /**256 bytes */,
            pub_k = 0 /**256 bytes */, 
            last_d = 1 /**8 bytes */}) {
                let user_idBuff, expiredBuf,last_dBuff;
               //calculate relation lifetime of a session in Sec:
               let relationLifeTimeInSec = Number((expired - BigInt(Date.now()) ) / BigInt(1000));
                //making data: 
                let userData = this.#objToB64String({user_id,expired,priv_k, pub_k, last_d});
                //making session key
                let sessionKey = this.#convertSessionKey({hi_p,lo_p});
            
                //making user key
                let userKey = this.#convertUserKey(user_id);
               
                    await this.#client.set("myuniquevariable","testvariable",{EX:10});
                    ///console.log(await this.#client.get("myuniquevariable"));
                    //store session, add expiration time in Sec
                    await this.#client.set(sessionKey,userData, {EX: relationLifeTimeInSec, NX: true});
                    //store user, add expiratin time in Sec
                    return  await this.#client.set(userKey,sessionKey,{EX: relationLifeTimeInSec, NX: true});
                  
                    
         }
/**
 * 
█ █▀   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█   █▀▀ ▀▄▀ █ █▀ ▀█▀ █▀
█ ▄█   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█   ██▄ █░█ █ ▄█ ░█░ ▄█
 */
         async isSessionExists({hi_p=1, lo_p=2}){
              //making session key
            let sessionKey = this.#convertSessionKey({hi_p,lo_p});
          
                //get session data
            if( await this.#client.get(sessionKey)){
                return true;
            } else{
                return false;
            }
          
         }
/**
 * 
█▀ █▀▀ █▀▀ █▀ █ █▀█   █▄▄ █▄█   █ █▀▄
▄█ ██▄ ██▄ ▄█ █ █▄█   █▄█ ░█░   █ █▄▀
 */
         async getSessionById({hi_p=1, lo_p=2}){

            //console.log(await this.#client.get("myuniquevariable"));
             //making session key
          let sessionKey = this.#convertSessionKey({hi_p, lo_p});
            
             //get session data
          let rawData =  await this.#client.get(sessionKey);
            if (!rawData) {
              return false;
            }
               return this.#b64stringToObj(rawData);
               
         }
/*

█▀▀ █░░ █▀▀ ▄▀█ █▀█   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█   █░█░█ █░█ █▀▀ █▄░█   █▀▀ ▀▄▀ █ █▀ ▀█▀ █▀
█▄▄ █▄▄ ██▄ █▀█ █▀▄   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█   ▀▄▀▄▀ █▀█ ██▄ █░▀█   ██▄ █░█ █ ▄█ ░█░ ▄█
*/
         async clearSessionWhenExists(user_id) {
            //making user key
            let userKey = this.#convertUserKey(user_id);
               
            //ask for session_id
            let sessionId = await this.#client.get(userKey);
            if (!sessionId) {
                return false;
            }
                //clear session 
                       await this.#client.del(sessionId)
               return await this.#client.del(userKey)
                          

         }

         /*
         
█░█ █▀█ █▀▄ ▄▀█ ▀█▀ █▀▀   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█   ▀█▀ █ █▀▄▀█ █▀▀ █▀ ▀█▀ ▄▀█ █▀▄▀█ █▀█ █▀
█▄█ █▀▀ █▄▀ █▀█ ░█░ ██▄   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█   ░█░ █ █░▀░█ ██▄ ▄█ ░█░ █▀█ █░▀░█ █▀▀ ▄█
         */

         async updateSessionTimestamps ({hi_p=0, lo_p=0, expired=1, last_d=1}) {
            let sessionKey = this.#convertSessionKey({hi_p,lo_p});
               
            //making user key
            let sessionData = await this.#client.get(sessionKey);
            //converting to an object
            let session = this.#b64stringToObj(sessionData);
            //making user key
            let userKey = this.#convertUserKey(session.user_id);
                

             //calculate relation lifetime of a session in Sec:
             let relationLifeTimeInSec = Number((expired - BigInt(Date.now()) ) / BigInt(1000));
            //update 
            session.expired = expired;
            session.last_d = last_d;
            //save
             await this.#client.set(sessionKey, this.#objToB64String(session),{XX:true, EX:relationLifeTimeInSec});
            //extends lifetime
            await this.#client.expire(sessionKey, relationLifeTimeInSec);
            await this.#client.expire(userKey, relationLifeTimeInSec);

         }
         

    
   
}

module.exports = {StorageSessioonsOnRedis}