const express = require('express')
const dbLayer  = require("./db");
const sessionL = require("./sessions");
const redisStore = require('./redisStore')
const mysqlStore = require("./mySqlStore");

// Require the router module
let registerRouter = require('./routes/register');
let loginRouter = require('./routes/login');
let validationRouter = require('./routes/validate');


const app = express();
const port = 8080;

async function main_proc(){
    //db pool init
    let rdbmsLayer = new dbLayer.MysqlLayer({basename:"my_bot", password:"65535258", user:"root", host:"localhost"});
    //when tables absent - create it:
    await rdbmsLayer.initDb();
    
    //create mysql storage
   let store = new mysqlStore.StorageOfSessions(rdbmsLayer.getMysqlPool());
   //int the store
   await store.init();

    /* when a store is Redis
      let store = new redisStore.StorageSessioonsOnRedis();
      await  store.init();
    */

    //create sessions factory
    let sessions = new sessionL(store);

    registerRouter.router.rdbmsLayer = rdbmsLayer;
    loginRouter.router.rdbmsLayer = rdbmsLayer;
    loginRouter.router.sessionLayer = sessions;
    validationRouter.router.sessions = sessions;
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use('/register', registerRouter.router);
    app.use('/login', loginRouter.router);
    app.use('/validate', validationRouter.router);
    app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}

main_proc();

process.on("exit", async()=>{
  await rdbmsLayer.closeDatabase();
  await store.deInit();
})






