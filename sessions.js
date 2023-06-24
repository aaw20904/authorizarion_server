const crypto = require("crypto");
const { resolve } = require("path");
class Sessions {
    #createSign;
    #verifySign;
    #keygen;
    #idGen;
    #uint64ToBase64url;
    #base64urlToUint64;
    #base64ToBuffer;
    #createDigitalSignature;
    #verifyDigitalSignature;
    #sessionExpirationLimit;
    constructor () {
        this.#sessionExpirationLimit = (1000 * 3600)|0; //one hour
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
              //signature and data are in base64url
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
        this.#keygen = async (passphrase="cat") =>{
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
                        if(err){
                            reject(err);
                        } else{
                             
                            resolve({privateKey , publicKey});
                        }
                    // Handle errors and use the generated key pair.
                    });

            });
        }
 
    }
  
    tob64(num){
        return this.#uint64ToBase64url(num)
    }

    async createNewSession(user_id){
        let sessionExists = true;
        let  sessionIds, keyPair, sessionToken, b64Signature, issued, activeUntil,
         b64HighId, b64LowId, b64Issued;
        //1)Making key pair
        keyPair = await this.#keygen();
        //2)When the sessions with this user exists - remove it:
         await this.storage.clearSessionWhenExists(user_id);
        //3)Generate ID of session (two component);
        while (sessionExists) {
            //try to generate ID of the sessoin
            sessionIds = await this.#idGen();
            //checking - is there an another user`s sessions with the same primary key?
            sessionExists = await this.storage.isSessionExists({hi_p:sessionIds.high, lo_p:sessionIds.low});
        }
        //4) issuance data and expiration threshold
        issued = Date.now();
        activeUntil = issued + this.#sessionExpirationLimit;
         
        //5) Making Base64 string
        b64HighId = this.#uint64ToBase64url(sessionIds.high);
        b64LowId = this.#uint64ToBase64url(sessionIds.low);
        b64Issued = this.#uint64ToBase64url(issued);
        
        //6) Making signature
        b64Signature = await this.#createDigitalSignature(keyPair.privateKey, `${b64HighId}${b64LowId}${b64Issued}`);
        //7) construct all the token
        sessionToken = `${b64HighId}${b64LowId}${b64Issued}${b64Signature}`;
        //8)Save session into storage:
        await this.storage.createUserSession({
           hi_p: sessionIds.high, 
           lo_p: sessionIds.low, 
           user_id: user_id, 
           expired: activeUntil,
            priv_k: keyPair.privateKey, 
            pub_k: keyPair.publicKey, 
            last_d: issued-2
        });
        
        //9)return base64url session ID token:
        return sessionToken
        /*TEST ONLY: Verify Signature .Inst of Verify must using only one time!
         const verify = await this.#verifyDigitalSignature(keyPair.publicKey,`${b64HighId}${b64LowId}${b64Issued}`,signature);*/

    }

    async verifyUserSession(token){
        let  sessionIds,highId, lowId, keyPair, sessionToken, b64signature, issued, activeUntil,
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
        //3)get the session;
        storedSession = await this.storage.getSessionById({hi_p:highId, lo_p:lowId});
        //when not exists:
        if(!storedSession){
            return false;
        }
        //4) Has a session been expired?
        if(Date.now() > storedSession.expired ){
            return false;
        }
        //5) Has a session been reused?
        if (storedSession.last_d === issued) {
            //remove a session
            await this.storage.clearSessionWhenExists(storedSession.user_id);
            return false;
        }
        //6)Checking digital signature
        



    }
}

module.exports = Sessions;