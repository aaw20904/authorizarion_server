const crypto = require("crypto");
class Sessions {
    #keygen;
    #idGen;
    constructor(){
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
            return await new Promise((resolve, reject) => {
                        
            crypto.generateKeyPair('rsa', {
                                            modulusLength: 530,    // options
                                            publicExponent: 0x10101,
                                            publicKeyEncoding: {
                                                type: 'pkcs1',
                                                format: 'der'
                                            },
                                            privateKeyEncoding: {
                                                type: 'pkcs8',
                                                format: 'der',
                                                cipher: 'aes-192-cbc',
                                                passphrase: passphrase
                                            }
                                        },  (err, publicKey, privateKey) => { // Callback function
                                                if (!err) {
                                                resolve({publicKey, privateKey});
                                                } else {
                                                // Prints error
                                                reject(err);
                                                }
                                                
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
        
        let actionComplete = true;
        let tempNum, sessionIds, keyPair, sessionToken, b64HighId, b64LowId, b64Issued, b64Signature, tempBuf;
        //A)Making key pair
        keyPair = await this.#keygen('pussycat');
        //B)Generate ID of session (two component);
        while (actionComplete) {
            //try to generate ID of the sessoin
            sessionIds = await this.#idGen();
            actionComplete = await this.storage.isSessionExists({hi_p:sessionIds.high, lo_p:sessionIds.low});
        }
        //C)Making Base64 string 
         tempBuf = Buffer.allocUnsafe(8);
         tempNum = BigInt(sessionIds.high);
         tempBuf.writeBigUInt64BE(tempNum);
         tempNum = tempBuf.toString("base64url");

       return tempNum; // this.storage.createSession({hi_p:2, lo_p:3, user_id:usr_id});
    }
}

module.exports = Sessions;