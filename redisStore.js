const redis = require('redis');
const util = require('util');
class StorageSessioonsOnRedis{
    #client;
    #rdbms;
    #sessionLifeTime;
   
    #convertUserKey;
    #convertSessionKey;
  
    #b64stringToObj;
    #objToB64String;

    constructor(sessionMaxLifeTime=(60*14*60)/**in Seconds */) {
    
        this.#sessionLifeTime = sessionMaxLifeTime;
        
        this.#client =  redis.createClient();
        this.#client.on('error', err => console.log('Redis Client Error', err));

        this.#convertSessionKey = ({hi_p, lo_p})=>{
            let bufHi, bufLo, res;
            bufHi = Buffer.allocUnsafe(8);
            bufLo = Buffer.allocUnsafe(8);
            bufHi.writeBigUint64BE(hi_p);
            bufLo.writeBigUint64BE(lo_p);
            res = Buffer.concat([bufHi,bufLo]);
            return res.toString("base64");
        }

        this.#convertUserKey = (user_id)=>{
            if (typeof value !== 'bigint') {
                 user_id = BigInt(user_id);
            }
           let bufK = Buffer.allocUnsafe(8);
            bufK.writeBigUint64BE(user_id);
            return bufK.toString('base64');
        }

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

       async deInit(){
        await this.#client.disconnect();
       }
/**create a session with lifetime value that has been received as constructor arg */
        async createUserSession ({
            hi_p = 1/**8 Bytes */,
            lo_p = 2/**8 bytes */,
            user_id = 3 /**8 bytes */, 
            expired = 8 /*8 bytes*/,
            priv_k = 0 /**256 bytes */,
            pub_k = 0 /**256 bytes */, 
            last_d = 1 /**8 bytes */}) {
                let user_idBuff, expiredBuf,last_dBuff;
               
                //making data: 
                let userData = this.#objToB64String({user_id,expired,priv_k, pub_k, last_d});
                //making session key
                let sessionKey = this.#convertSessionKey({hi_p,lo_p});
                //making user key
                let userKey = this.#convertUserKey(user_id);
                //
                //await this.#client.connect();
                //transaction
                return    await this.#client.multi()
                    //store session
                    .set(sessionKey,userData)
                    //store user
                    .set(userKey,sessionKey)
                    //assign lifetime of a session:
                    .expire(sessionKey, this.#sessionLifeTime)
                    .expire(userKey, this.#sessionLifeTime)
                    //
                    .exec();
         }

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

         async getSessionById({hi_p=1, lo_p=2}){
             //making session key
          let sessionKey = this.#convertSessionKey({hi_p, lo_p});
             //get session data
          let rawData =  await this.#client.get(sessionKey);
            if (!rawData) {
              return false;
            }
               return this.#b64stringToObj(rawData);
               
         }

         async clearSessionWhenExists(user_id) {
            //making user key
            let userKey = this.#convertUserKey(user_id);
            //ask for session_id
            let sessionId = await this.#client.get(userKey);
            if (!sessionId) {
                return false;
            }
                //clear session 
          return await this.#client.multi()
                            .del(sessionId)
                            .del(userKey)
                            .exec()

         }

         async updateSessionTimestamps ({hi_p=0, lo_p=0, expired=1, last_d=1}) {
            let sessionKey = this.#convertSessionKey({hi_p,lo_p});
            let sessionData = await this.#client.get(sessionKey);
            let session = this.#b64stringToObj(sessionData);
            //update 
            session.expired = expired;
            session.last_d = last_d;
            //save
            return await this.#client.set(sessionKey, session);
         

         }
         

    
   
}

module.exports = {StorageSessioonsOnRedis}