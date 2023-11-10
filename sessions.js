const crypto = require("crypto");
//const path = require("path");
class Sessions {
    
    #keygen;
    #idGen;
    #uint64ToBase64url;
    #base64urlToUint64;
    #extendSessionDurationUntil;
    #createDigitalSignature;
    #verifyDigitalSignature;
    #initialSessionDuration;
    #tokenExpirationLimit;
    #sessionExtensionTime;
    #storage;
    constructor (storage, sessionParams={///all the time are in milliSeconds
            sessionExtensionTime: BigInt(1000 * 60 * 5), //after successfull authorization (by token) - duration extended by this value
            initialSessionDuration: BigInt(1000 * 60 * 15), /* when a session created - the initial duration assigned */
            tokenLifeTime: BigInt(1000 * 60 * 15), /*lifetime of token.This value stays the 
                                                    same during all time of life of a session */
            extendSessionDurationUntil: BigInt(1000 * 60 * 60), //when session duration has reached to this value - extension not allowed
    }) {
        /** T I M E O U T  E X T E N S I O N   E X P L A N A T I O N
         NOTE. Imagine and suppose: we have time - 12:00. 
          this.#initialSessionDuration = 30min,
          this.#sessionExtensionTime  = 5min,
          this.#extendSessionDurationUntil = 50min

          Expiration timeout holds in storage as "expired"

          "expired" = session_create_time + this.#initialSessionDuration
                                 =  11:50 + 30min = 12:20. 
        
          
          When  user authorized successfully (using Bearer token):
            Firstly: we checking - can we extends a timeout?

           ("expired" - NOW() ) <  this.#extendSessionDurationUntil  ?
                             20 < 50 - yes! We can!

          And "expired" will be extended:
                 "expired" + this.#sessionExtensionTime = 12:20 + 5min = 12:25.
        
        suppose - we have "expired" = 12:55, checking-

          ("expired" - NOW() ) <  this.#extendSessionDurationUntil  ?
                 (12:55-12:00) > 50 - No! We can`t! 
        
       So, we don`t extend the timeout - because it is bigf enough for us.
           
         */
        this.#storage = storage;
        this.#sessionExtensionTime = sessionParams.sessionExtensionTime;//add to session expiration time when successfuly validated
        this.#initialSessionDuration = sessionParams.initialSessionDuration; //one hour
        this.#tokenExpirationLimit = sessionParams.tokenLifeTime; //5 minutes - lifetime of the token
        this.#extendSessionDurationUntil = sessionParams.extendSessionDurationUntil;
            ///input data  - base64url string, output signature - base64
          this.#createDigitalSignature = async (privateKey, data, passphrase='cat')=>{
                return new Promise((resolve, reject) => {
                        crypto.sign('sha256', Buffer.from(data,'base64url'), {
                                    key: privateKey,
                                    passphrase: passphrase,
                                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                                    
                                },  (err, signature)=>{
                                        if(err){
                                            reject(err)
                                        }else{
                                            resolve(signature.toString("base64url"))
                                        }
                                });
                });
            
          }
              //s i g n a t u r e   and  d a t a are in base64url
          this.#verifyDigitalSignature = async (publicKey, data, signatureToVerify)=>{
            return new Promise((resolve, reject) => {
                        crypto.verify('sha256', Buffer.from(data,'base64url'), {
                                key: publicKey,
                                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                            }, Buffer.from(signatureToVerify,"base64url"), (err, result)=>{
                                if(err){
                                    reject(err);
                                } else {
                                    resolve(result);
                                }
                        });
            });
         
          }
      //conver UINT64 to Base64url
        this.#uint64ToBase64url = (numToDec=256) => {
          let myBuf = Buffer.allocUnsafe(8);
          myBuf.writeBigUInt64BE(BigInt(numToDec));
          return myBuf.toString("base64url");
        }

        this.#base64urlToUint64 = (data="") =>{
            let myBuf = Buffer.from(data, "base64url");
            return BigInt(myBuf.readBigUInt64BE(0));
        }

        //generate random number from two parts
        this.#idGen = async () =>{
            return  new Promise((resolve, reject) => {
                crypto.randomBytes(16,(err, buf)=>{
                    if(err){
                        reject(err)
                    }else{
                        let high = buf.readBigUInt64BE(0);
                        let low = buf.readBigUInt64BE(8);
                        resolve({high, low});
                    }
                })
            });
        }

       //generate key pair
        this.#keygen = async (passphrase="cat")=>{
            return new Promise((resolve, reject) => {
               crypto.generateKeyPair('rsa', {
                    modulusLength: 2048,
                      publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem',
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem',
                        cipher: 'aes-256-cbc',
                        passphrase: passphrase
                      },
                   
                    }, (err, publicKey, privateKey) => {
                        if (err) {
                            reject(err);
                        } else {
                             
                            resolve({privateKey , publicKey});
                        }
                    // Handle errors and use the generated key pair.
                    });

            });
        }
 
    }
  
    tob64 (num) {
        return this.#uint64ToBase64url(num)
    }
                /**
          
█▀▄▀█ ▄▀█ █▄▀ █▀▀   █▄░█ █▀▀ █░█░█   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█
█░▀░█ █▀█ █░█ ██▄   █░▀█ ██▄ ▀▄▀▄▀   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█
                */
    async createNewSession(user_id){
        
        let sessionExists = true;
        let  sessionIds, keyPair, sessionToken, b64Signature, issued, activeUntil,
         b64HighId, b64LowId, b64Issued;
        //---1) Making key pair
        keyPair = await this.#keygen();
        //---2) When the sessions with this user exists - remove it:
         await this.#storage.clearSessionWhenExists(BigInt(user_id));
        //---3) Generate ID of session (two component);
        while (sessionExists) {
            // try to generate ID of the sessoin
            sessionIds = await this.#idGen();
            // checking - is there an another user`s sessions with the same ID (composite primary key)?
            sessionExists = await this.#storage.isSessionExists({hi_p:sessionIds.high, lo_p:sessionIds.low});
        }
        //---4) issuance data and expiration (token and session) threshold
        issued = BigInt( Date.now());
        activeUntil = BigInt(Date.now()) + this.#initialSessionDuration;
        
         
        //---5) Making Base64 string
        b64HighId = this.#uint64ToBase64url(sessionIds.high);
        b64LowId = this.#uint64ToBase64url(sessionIds.low);
        b64Issued = this.#uint64ToBase64url(issued);
        
        //---6) Making signature
        b64Signature = await this.#createDigitalSignature(keyPair.privateKey, `${b64HighId}${b64LowId}${b64Issued}`);
        //---7) construct all the token
        sessionToken = `${b64HighId}${b64LowId}${b64Issued}${b64Signature}`;
        //---8) Save session into storage:
        await this.#storage.createUserSession({
           hi_p: sessionIds.high, 
           lo_p: sessionIds.low, 
           user_id: BigInt(user_id), 
           expired: activeUntil,
            priv_k: keyPair.privateKey, 
            pub_k: keyPair.publicKey, 
            last_d: issued-BigInt(2),
        });
        
        //---9) return base64url session ID token:
        return sessionToken
        /*TEST ONLY: Verify Signature .Inst of Verify must using only one time!
         const verify = await this.#verifyDigitalSignature(keyPair.publicKey,`${b64HighId}${b64LowId}${b64Issued}`,signature);*/

    }
   /**
    
        █░█ █▀▀ █▀█ █ █▀▀ █ █▀▀ ▄▀█ ▀█▀ █ █▀█ █▄░█
        ▀▄▀ ██▄ █▀▄ █ █▀░ █ █▄▄ █▀█ ░█░ █ █▄█ █░▀█
    */
    async verifyUserSession (token) {
        let redSessionData,verifiedSignatureTimestamp,updatedSessTimestamp, newSignatureTimestamp;
        let verifyStartTimestamp = Date.now();
        let   highId, lowId,  b64signature, issued,  updatedExpirationTime,
        b64highId, b64lowId, b64Issued, storedSession, resultOfVerification;
        //1)parse parameters;
        b64highId = token.slice(0,11);
        b64lowId = token.slice(11,22);
        b64Issued = token.slice(22,33);
        b64signature = token.slice(33, token.length);
        //2)converting to values
        highId = this.#base64urlToUint64(b64highId);
        lowId = this.#base64urlToUint64(b64lowId);
        issued = this.#base64urlToUint64(b64Issued);
        //3) Has the  token been expired?
          if(BigInt(Date.now()) > BigInt(issued) + this.#tokenExpirationLimit){
            return false;
        }
        //4)get the session;
        storedSession = await this.#storage.getSessionById({hi_p:highId, lo_p:lowId});
        ///dbg
        redSessionData = Date.now() - verifyStartTimestamp;
       // console.log('\x1b[33m',"Session expiration:",new Date(Number(storedSession.expired)).toLocaleString(),'\x1b[0m');
        //Is the session exists?:
        if(!storedSession){
            return false;
        }
        //5) Has a session been expired?
        if(BigInt(Date.now()) > BigInt(storedSession.expired) ){
            return false;
        }
      
        //6) Has a session been reused?
        let lastSavedTimeStamp = BigInt(storedSession.last_d);
        if ( lastSavedTimeStamp === issued) {
            //remove a session
            await this.#storage.clearSessionWhenExists(storedSession.user_id);
            return false;
        }
        //7)Is a digital signature valid?
        try {
            resultOfVerification = await this.#verifyDigitalSignature(storedSession.pub_k,`${b64highId}${b64lowId}${b64Issued}`,b64signature);
        } catch(e) {
            //when an error as been occured during verification
            return false;
        }
        verifiedSignatureTimestamp = Date.now() - verifyStartTimestamp;

        if (!resultOfVerification) {
         //when a signature isn`t valid
            return false;
        }
        updatedExpirationTime = BigInt(storedSession.expired);
        //7.1)Checking: can we extends expiration?
         if( (updatedExpirationTime - BigInt(Date.now())) < this.#extendSessionDurationUntil ) {
            //extends lifetime
             updatedExpirationTime +=  this.#sessionExtensionTime;

         } else{
            //stay the same lifetime
            //updatedExpirationTime = storedSession.expired;
         }
        //7.2) Saving iss that has been received into storage and extends expiration time:
          await this.#storage.updateSessionTimestamps({hi_p:highId, lo_p:lowId, expired: BigInt(updatedExpirationTime), last_d:issued});
         updatedSessTimestamp = Date.now() - verifyStartTimestamp;
          //8) Updtae issuance time of the token (refresh):
          b64Issued = this.#uint64ToBase64url(Date.now());
        //9) Create a new signature:
          b64signature = await this.#createDigitalSignature(storedSession.priv_k,`${b64highId}${b64lowId}${b64Issued}`);
          newSignatureTimestamp = Date.now() - verifyStartTimestamp;
          //10) Return a new token
        return {redSessionData,verifiedSignatureTimestamp,updatedSessTimestamp, newSignatureTimestamp,
                token:`${b64highId}${b64lowId}${b64Issued}${b64signature}`, 
                user_id: storedSession.user_id.toString()
               };

    }
    /*
    
█▀█ █▀▀ █▀▄▀█ █▀█ █░█ █▀▀   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█
█▀▄ ██▄ █░▀░█ █▄█ ▀▄▀ ██▄   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█
    */

    async removeSession(token) {
        let   highId, lowId,  b64signature, issued, resultOfVerification,
        b64highId, b64lowId, b64Issued, storedSession;
        //1)parse parameters;
        b64highId = token.slice(0,11);
        b64lowId = token.slice(11,22);
        b64Issued = token.slice(22,33);
        b64signature = token.slice(33, token.length);
        //2)converting to values
        highId = this.#base64urlToUint64(b64highId);
        lowId = this.#base64urlToUint64(b64lowId);
        issued = this.#base64urlToUint64(b64Issued);
        //3) Has the  token been expired?
          if(BigInt(Date.now()) > BigInt(issued) + this.#tokenExpirationLimit){
            return false;
        }
        //4)get the session;
        storedSession = await this.#storage.getSessionById({hi_p:highId, lo_p:lowId});
        //5)Is the session exists?
        if(storedSession) {
            //6)Is a digital signature valid?
                try {
                    resultOfVerification = await this.#verifyDigitalSignature(storedSession.pub_k,`${b64highId}${b64lowId}${b64Issued}`,b64signature);
                } catch(e) {
                    //when an error as been occured during verification
                    return false;
                }

                if (!resultOfVerification) {
                //when a signature isn`t valid
                    return false;
                }
            //7)remove  a session
            await this.#storage.clearSessionWhenExists(storedSession.user_id);
            return true;
        } else {
             return false;
        }
       
    }
}

module.exports = Sessions;