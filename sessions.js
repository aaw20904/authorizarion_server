const crypto = require("crypto");
class Sessions {
    #createSign;
    #verifySign;
    #keygen;
    #idGen;
    #uint64ToBase64;
    #base64ToUint64;
    #base64ToBuffer;
    #createDigitalSignature;
    #verifyDigitalSignature;
    constructor(){
          this.#createDigitalSignature = (pk, data)=>{
            //sign data - must been used ONCE!
            const sign = crypto.createSign('SHA256');
            sign.update(data);
            let result = sign.sign(pk, 'base64url');
            return result;
          }

          this.#verifyDigitalSignature = (pubk, data, sign)=>{
                 // Verify Signature .Inst of Verify must using only one time!
                const verify = crypto.createVerify('SHA256');
                verify.update(data);
                const isSignatureValid = verify.verify(pubk, sign, 'base64url');
                return isSignatureValid;
          }
      
        

        this.#uint64ToBase64 = (numToDec=256) => {
          let myBuf = Buffer.allocUnsafe(8);
          myBuf.writeBigUInt64BE(BigInt(numToDec));
          return myBuf.toString("base64url");
        }

        this.#base64ToUint64 = (data="") =>{
            let myBuf = Buffer.from(data, "base64url");
            return BigInt(myBuf.readBigUInt64BE(myBuf));
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
        this.#keygen = async (passphrase="456hgfh") =>{
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
                    }
                   
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
    async createKey(psw){
        return this.#keygen(psw);
    }

    

    async genNum(){
        return this.#idGen();
    }

    async createNewSession(usr_id){
        
        let sessionExists = true;
        let  sessionIds, keyPair, sessionToken, signature, issued,
         b64HighId, b64LowId, b64Issued, b64Signature, tempBuf;
        //A)Making key pair
        keyPair = await this.#keygen('pussycat');
        //B)Generate ID of session (two component);
        while (sessionExists) {
            //try to generate ID of the sessoin
            sessionIds = await this.#idGen();
            sessionExists = await this.storage.isSessionExists({hi_p:sessionIds.high, lo_p:sessionIds.low});
        }

        //C) issuance data
        issued = Date.now() - 5;
        //D)Making Base64 string
        b64HighId = this.#uint64ToBase64(sessionIds.high);
        b64LowId = this.#uint64ToBase64(sessionIds.low);
        b64Issued = this.#uint64ToBase64(issued);
        //E)Making signature
 
        signature = this.#createDigitalSignature(keyPair.privateKey, `${b64HighId}${b64LowId}${b64Issued}`);

        //TEST Verify Signature .Inst of Verify must using only one time!
        const verify = this.#verifyDigitalSignature(keyPair.publicKey,`${b64HighId}${b64LowId}${b64Issued}`,signature);

      

   

        

       return tempNum; // this.storage.createSession({hi_p:2, lo_p:3, user_id:usr_id});
    }
}

module.exports = Sessions;