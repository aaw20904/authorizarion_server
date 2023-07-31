const mysql = require('mysql2'); //database mamnagement system MySQL

const mysqlPromise = require('mysql2/promise');

class MysqlLayer {
    #bdPool;
      constructor(par={basename:"basename", password:"psw", user:"usr",host:"host"}){
          this.#bdPool = mysqlPromise.createPool({
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
    //**********OK! tested!
    async initDb(){
        try{
                let connection = await this.#bdPool.getConnection();

                let result = await connection.query(
                    "CREATE TABLE IF NOT EXISTS `user_mail` ("+
                        " `email` VARCHAR(45) NOT NULL, "+
                        " `user_id` BIGINT UNSIGNED NULL AUTO_INCREMENT," +
                        " PRIMARY KEY (`email`),"+
                        " UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC) VISIBLE);"
                );
                result = result[0];

                result = await connection.query(
                    "CREATE TABLE IF NOT EXISTS `users` ("+
                            " `user_id` BIGINT UNSIGNED NOT NULL,"+
                            " `passw` BLOB NULL, "+
                            " `picture` BLOB NULL, "+
                            " `uname` VARCHAR(32) NULL, "+
                            " `salt` BLOB NULL, "+
                            " `fail_a` INT DEFAULT 0, "+
                            " `fail_date`BIGINT  UNSIGNED DEFAULT 0, "+
                            " `phone` VARCHAR(32) NULL, "+
                        " PRIMARY KEY (`user_id`),"+
                        // " CONSTRAINT `fk_user_id_user_m` "+
                            " FOREIGN KEY (`user_id`) "+
                            " REFERENCES `my_bot`.`user_mail` (`user_id`)" +
                            " ON DELETE CASCADE "+
                            " ON UPDATE NO ACTION);"
                );
            connection.release();
            return result[0];
        }catch(e){
            throw new Error(e);
        }
        

    }

   
    //********************OK! tested
    async closeDatabase(){
        return await this.#bdPool.end();
     }
    ///***************OK! tested!! */
     async createNewUser (par={name:"",password:"", email:"example@mail.com", picture:"123", passw:0, salt:0, phone:"911"}) {
        let connection, generated_identifier;
         
            connection = await this.#bdPool.getConnection();
            await connection.beginTransaction();
            try{
             //firstly fill a user_mail table:
                generated_identifier = await  connection.query('INSERT INTO user_mail ( email) VALUES (?)', [par.email]);
                //get generated Id by system
                generated_identifier = generated_identifier[0].insertId;
                //write user info using gnerated by MySQL user_id:
                await connection.query('INSERT INTO users ( user_id, passw, picture, uname,  salt, phone) VALUES (?, ?, ?, ?, ?, ?)',
                                          [generated_identifier, par.password, par.picture, par.name, par.salt, par.phone]);
                //apply 
                await connection.commit();
                
            }catch(err){
                 let myErr = new Error(err);
               //has a user already exists?
                if(err.errno === 1062){
                    myErr.alrEx = true;
                } else{
                    myErr.alrEx =false;
                }
                
                await connection.rollback();
               
                
                throw myErr;
            }finally{
                connection.release();
            }
  
     }

   
     //OK!****************** tested
    async getUserByEmail (email) {
        let connection = await this.#bdPool.getConnection();
        let result = await connection.query(
            `SELECT * FROM users INNER JOIN user_mail WHERE user_mail.email="${email}" AND users.user_id=user_mail.user_id;`
        );
        connection.release();
        return result[0][0];
    }
///OK!*******tested
    async incrementFailLogins (user_id) {
        let connection = await this.#bdPool.getConnection();
        let result = await connection.query(`UPDATE users SET fail_a=fail_a+1, fail_date=UNIX_TIMESTAMP()*1000 WHERE user_id=?;`,[ user_id]);
        connection.release();
        if(result.length >= 1){
            return result[0].affectedRows;
        }else {
            return false;
        }
    }

//OK!*****tested
    async  clearUserBlocking (user_id) {
        let connection = await this.#bdPool.getConnection();
        let result = await  connection.query(`UPDATE users SET fail_a=0 WHERE user_id=? ;`,[user_id]);
        connection.release();
        if(result.length >= 1){
            return result[0].affectedRows;
        }else {
            return false;
        }

    }
   

}



module.exports ={ MysqlLayer};

  
