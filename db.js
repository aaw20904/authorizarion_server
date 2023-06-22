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

    async initDb(){
        return new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query("CREATE TABLE IF NOT EXISTS `my_bot`.`user` ("+
                   " `user_id` INT NOT NULL AUTO_INCREMENT,"+
                   "`email` VARCHAR(45) NOT NULL,"+
                   " `passw` BLOB NULL,"+
                   " `picture` BLOB NULL,"+
                   "`name` VARCHAR(45) NULL,"+
                  " PRIMARY KEY (`user_id`)," +
                  " UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE);" ,
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

    async createNewUser(par={name:"",password:"", email:"example@mail.com", picture:"123"}){
         return new Promise((resolve, reject) => {
             this.#bdPool.getConnection((err, connection)=>{
                if (err) {
                    reject(err);
                } else {
                    connection.query('INSERT INTO user ( email, passw, picture, name) VALUES (? , ?, ?, ?)',
                        [par.email, par.password, par.picture, par.name], (err, rows, fields)=>{
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

    async getUserByEmail (email) {
        return new Promise((resolve, reject) => {
            this.#bdPool.getConnection((err, connection)=>{
               if (err) {
                   reject(err);
               } else {
                   connection.query(`SELECT * FROM user WHERE email="${email}";`,
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
   
    
} 


module.exports = MysqlLayer;

  
