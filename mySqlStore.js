 /************* */
 class StorageOfSessions {
    #mysqlPool;
    constructor(pool){
        this.#mysqlPool = pool;
    }
  // IMPORTANT NOTE ! call this method before using mysql storage

    async init() {
        let connection = await this.#mysqlPool.getConnection();
        await connection.query("CREATE TABLE IF NOT EXISTS session ("+
                    "hi_p BIGINT UNSIGNED NOT NULL,"+
                    "lo_p BIGINT UNSIGNED NOT NULL,"+
                    "user_id BIGINT UNSIGNED NOT NULL,"+
                    "expired BIGINT UNSIGNED NULL,"+
                    "priv_k BLOB NULL,"+
                    "pub_k BLOB NULL,"+
                    "last_d BIGINT UNSIGNED NULL,"+
                    "PRIMARY KEY (hi_p, lo_p),"+
                    "FOREIGN KEY (user_id) REFERENCES users(user_id)   ON DELETE CASCADE);");
        connection.release();
    }
/*
    async init_old() {
        await new Promise((resolve, reject) => {
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
                    "FOREIGN KEY (user_id) REFERENCES users(user_id)   ON DELETE CASCADE);" ,
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
*/

   async isSessionExists ({hi_p=BigInt(1), lo_p=BigInt(2)}) {
        let connection = await this.#mysqlPool.getConnection();
        const [rows , fields] = await connection.query(`SELECT user_id FROM session WHERE hi_p=? AND lo_p=?;`, [hi_p, lo_p]);
        connection.release();
        return   rows.length === 0 ? false : true;
   }



    async isSessionExists_old({hi_p=BigInt(1), lo_p=BigInt(2)}){
      
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

        async getSessionById ({hi_p=BigInt(3), lo_p=BigInt(7)}) {
         let connection = await this.#mysqlPool.getConnection();
         const [rows] = await connection.query(`SELECT * FROM session WHERE hi_p=? AND lo_p=?;`,
                      [hi_p, lo_p]);
            connection.release();
            if (rows.length===0) {
                return false
            } else {
                return rows[0];
            }
        
        }

      async getSessionById_old({hi_p=BigInt(3), lo_p=BigInt(7)}){
         
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
            let connection = await this.#mysqlPool.getConnection();
            try{
                 const [rows] = await connection.query(`DELETE  FROM session WHERE user_id=?;`,
                   [user_id],);
                 connection.release();
                 return rows.length === 0 ? false : true;
            } catch (err) {
                if(connection) {
                    connection.release();
                }
                throw new Error(err);
            }
           
          }

    async clearSessionWhenExists_old(user_id=BigInt(5)) {
       
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

    async createUserSession({hi_p=BigInt(1), lo_p=BigInt(2), user_id=BigInt(3),expired=BigInt(4), priv_k, pub_k, last_d=BigInt(5)}) {
        let connection = await this.#mysqlPool.getConnection();
        try{
            const [ rows ] = await connection.query(`INSERT INTO session (hi_p, lo_p, user_id, expired, priv_k, pub_k, last_d ) VALUES (?,?,?,?,?,?,?);`,
                                                [hi_p, lo_p, user_id, expired, priv_k, pub_k, last_d],);
            connection.release();
            return rows;
        } catch (err) {
             let myerr = new Error(err)
                      if (err.errno === 1062) {
                        myerr.sessEx = true;
                    } if (err.errno == 1452) {
                         myerr.wrongUsr = true;
                    } //release a connection to the pool
                      if(connection){
                        connection.release();
                      }
                 throw myerr;
        }
    }

    async createUserSession_old ({hi_p=BigInt(1), lo_p=BigInt(2), user_id=BigInt(3),expired=BigInt(4), priv_k, pub_k, last_d=BigInt(5)}) {
      
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
        let connection = await this.#mysqlPool.getConnection();
        try{
            const [rows] = connection.query(`UPDATE session SET last_d=?, expired=? WHERE hi_p=? AND lo_p=?;`,
                   [last_d, expired, hi_p, lo_p]);
            connection.release();
            return rows;
        } catch (err){
               let myerr = new Error(err)
                if (err.errno === 1062)  {
                    myerr.sessEx = true;
                } if (err.errno == 1452) {
                    myerr.wrongUsr = true;
                }
                //save connection
                if(connection) {
                        connection.release();
                }

                    throw myerr;
            
        } 
            
    }

    async updateSessionTimestamps_old ({hi_p=BigInt(1), lo_p=BigInt(2), expired=BigInt(3), last_d=BigInt(4)}) {
       
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

module.exports={StorageOfSessions};