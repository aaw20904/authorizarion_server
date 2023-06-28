const crypto = require("crypto");

class PasswordHash {
    constructor(){}
    async hashingPassword(psw="string") {
        const salt = crypto.randomBytes(16).toString("hex");
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(psw, salt, 10000, 64, 'sha512', (err,key)=>{
                if (err) {
                    reject(err)
                } else {
                    resolve({key, salt});
                }
            })
        });
    }

    async verifyPassword (password, storedHash, salt) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt,10000,64,'sha512',(err,key)=>{
                if (err) {
                    reject(err)
                } else {
                    //
                    let result = crypto.timingSafeEqual(storedHash, key);
                    resolve(result);
                }
            })
        });
    }
}

module.exports={PasswordHash}