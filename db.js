const mysql = require('mysql2'); //database mamnagement system MySQL

class MysqlLayer {
    #bdPool;
      constructor(par={basename:"basename", password:"psw", user:"usr",host:"host"}){
          this.#bdPool = mysql.createPool({
            host: par.host,
            user: par.user,
            password: par.password,
            database: par.basename,
            connectionLimit: 10 // Specify the maximum number of connections in the pool
          });
    }

    getMysqlPool(){
        return this.#bdPool;
    }

    async initDb(){

        await new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query("CREATE TABLE IF NOT EXISTS users ("+
                   " user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,"+
                   "email VARCHAR(45) NOT NULL,"+
                   "passw BLOB NULL,"+
                   "salt BLOB NULL"+
                   "fail_a INT  DEFAULT 0"+
                   "fail_date INT  DEFAULT 0"+
                   " picture BLOB NULL,"+
                   "name VARCHAR(45) NULL,"+
                  " PRIMARY KEY (user_id)," +
                  " UNIQUE INDEX email (email) VISIBLE);" ,
                       (err, rows, fields)=>{
                           if (err) {
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                               resolve(rows);
                           }
                   })
               }
            })
        });

        return new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query("CREATE TABLE IF NOT EXISTS session ("+
                   "hi_p BIGINT UNSIGNED NOT NULL,"+
                   "lo_p BIGINT UNSIGNED NOT NULL,"+
                   "user_id BIGINT UNSIGNED NOT NULL,"+
                   "expired BIGINT UNSIGNED NULL,"+
                   "priv_k BLOB NULL,"+
                   "pub_k BLOB NULL,"+
                   "last_d BIGINT UNSIGNED NULL,"+
                   "PRIMARY KEY (hi_p, lo_p),"+
                   "FOREIGN KEY (user_id) REFERENCES user(user_id)   ON DELETE CASCADE);" ,
                       (err, rows, fields)=>{
                           if (err) {
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                               resolve(rows);
                           }
                   })
               }
            })
        });

   

    }

    async closeDatabase(){
        return new Promise((resolve, reject) => {
            this.#bdPool.end((err)=>{
               if (err) {
                   reject(err);
               } else {
                 resolve()
               }
            })
        
         })
     }

    async createNewUser(par={name:"",password:"", email:"example@mail.com", picture:"123", passw:0, salt:0}){
         return new Promise((resolve, reject)=> {
             this.#bdPool.getConnection((err, connection)=>{
                if (err) {
                    reject(err);
                } else {
                    connection.query('INSERT INTO users ( email, passw, picture, name,  salt) VALUES (?, ?, ?, ?, ?)',
                        [par.email, par.password, par.picture, par.name, par.salt], (err, rows, fields)=>{
                            if (err) {
                                if(err.errno === 1062){
                                    err.alrEx = true;
                                } else{
                                    err.alrEx =false;
                                }
                                reject(err)
                            } else {
                                  // Release the connection back to the pool
                                connection.release();
                                resolve(rows);
                            }
                    })
                }
             })
         });
    }

    async getUserByEmail (email) {
        return new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`SELECT * FROM users WHERE email="${email}";`,
                     (err, rows, fields)=>{
                           if (err) {
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                               if(rows.length === 1) {
                                resolve(rows[0]);
                               } else {
                                resolve(false);
                               }
                               
                           }
                   })
               }
            })
        });
    }

    async incrementFailLogins(user_id) {
        return new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`UPDATE users SET fail_a=fail_a+1, fail_date=UNIX_TIMESTAMP()*1000 WHERE user_id=?;`,
                   [ user_id],
                     (err, rows, fields)=>{
                           if (err) {
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                               if(rows.length === 1) {
                                resolve(rows[0]);
                               } else {
                                resolve(false);
                               }
                               
                           }
                   })
               }
            })
        });
    }


    async clearUserBlocking (user_id) {
        return new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`UPDATE users SET fail_a=0 WHERE user_id=? ;`,
                   [user_id],
                     (err, rows, fields)=>{
                           if (err) {
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                               if(rows.length === 1) {
                                resolve(rows[0]);
                               } else {
                                resolve(false);
                               }
                               
                           }
                   })
               }
            })
        });
    }

}

/*******************/
class StorageRedis{
   
}


   /************* */
class StorageOfSessions {
    #mysqlPool;
    constructor(pool){
        this.#mysqlPool = pool;
    }

    async isSessionExists({hi_p=BigInt(1), lo_p=BigInt(2)}){
      
      
        return new Promise((resolve, reject) => {
          
               this.#mysqlPool.getConnection((err, connection)=>{
                  if (err) {
                      reject(err);
                  } else {
                      connection.query(`SELECT user_id FROM session WHERE hi_p=? AND lo_p=?;`,
                      [hi_p, lo_p],
                        (err, rows, fields)=>{
                              if (err) {
                                  reject(err)
                              } else {
                                    // Release the connection back to the pool
                                  connection.release();
                                  if(rows.length === 1) {
                                   resolve(true);
                                  } else {
                                   resolve(false);
                                  }
                                  
                              }
                      })
                  }
               })
           });
       
      }

      async getSessionById({hi_p=BigInt(3), lo_p=BigInt(7)}){
         
        return new Promise((resolve, reject) => {
            this.#mysqlPool.getConnection((err, connection)=>{
                  if (err) {
                      reject(err);
                  } else {
                      connection.query(`SELECT * FROM session WHERE hi_p=? AND lo_p=?;`,
                      [hi_p, lo_p],
                        (err, rows, fields)=>{
                              if (err) {
                                  reject(err)
                              } else {
                                    // Release the connection back to the pool
                                  connection.release();
                                  if(rows.length === 1) {
                                   resolve(rows[0]);
                                  } else {
                                   resolve(false);
                                  }
                                  
                              }
                      })
                  }
               })
           });
       
      }

    async clearSessionWhenExists(user_id=BigInt(5)) {
       
        return new Promise((resolve, reject) => {
            this.#mysqlPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`DELETE  FROM session WHERE user_id=?;`,
                   [user_id],
                     (err, rows, fields)=>{
                           if (err) {
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                               if(rows.length === 1) {
                                resolve(true);
                               } else {
                                resolve(false);
                               }
                               
                           }
                   })
               }
            })
        });
    }

    async createUserSession ({hi_p=BigInt(1), lo_p=BigInt(2), user_id=BigInt(3),expired=BigInt(4), priv_k, pub_k, last_d=BigInt(5)}) {
      
        return new Promise((resolve, reject) => {
            this.#mysqlPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`INSERT INTO session (hi_p, lo_p, user_id, expired, priv_k, pub_k, last_d ) VALUES (?,?,?,?,?,?,?);`,
                   [hi_p, lo_p, user_id, expired, priv_k, pub_k, last_d],
                     (err, rows, fields)=>{
                           if (err) {
                            if(err.errno === 1062){
                                err.sessEx = true;
                            } if(err.errno == 1452){
                                err.wrongUsr = true;
                            }
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                                resolve(rows);
                               
                           }
                   })
               }
            })
        });
    } 


    async updateSessionTimestamps ({hi_p=BigInt(1), lo_p=BigInt(2), expired=BigInt(3), last_d=BigInt(4)}) {
       
        return new Promise((resolve, reject) => {
            this.#mysqlPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`UPDATE session SET last_d=?, expired=? WHERE hi_p=? AND lo_p=?;`,
                   [last_d, expired, hi_p, lo_p],
                     (err, rows, fields)=>{
                           if (err) {
                            if (err.errno === 1062) {
                                err.sessEx = true;
                            } if (err.errno == 1452) {
                                err.wrongUsr = true;
                            }
                               reject(err)
                           } else {
                                 // Release the connection back to the pool
                               connection.release();
                                resolve(rows);
                               
                           }
                   })
               }
            })
        });
    } 


}

module.exports ={ MysqlLayer, StorageOfSessions};

  
