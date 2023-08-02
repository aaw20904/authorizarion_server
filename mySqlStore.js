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


   async isSessionExists ({hi_p=BigInt(1), lo_p=BigInt(2)}) {
        let connection = await this.#mysqlPool.getConnection();
        const [rows , fields] = await connection.query(`SELECT user_id FROM session WHERE hi_p=? AND lo_p=?;`, [hi_p, lo_p]);
        connection.release();
        return   rows.length === 0 ? false : true;
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

  

    async updateSessionTimestamps (argums={hi_p:BigInt(1), lo_p:BigInt(2), expired:BigInt(3), last_d:BigInt(4)}) {
        let connection = await this.#mysqlPool.getConnection();
        try{
            const [rows] = await connection.query(`UPDATE session SET last_d=?, expired=? WHERE hi_p=? AND lo_p=?;`,
                   [argums.last_d, argums.expired, argums.hi_p, argums.lo_p]);
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

    


}

module.exports={StorageOfSessions};