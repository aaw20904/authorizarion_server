
///to run in daemon mode - use PM2 
const cluster = require("cluster");
const numCPUs = require('os').cpus().length;

if(cluster.isMaster) {
  // Fork workers based on the number of CPU cores
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

   cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`);
      // Fork a new worker if a worker dies
      cluster.fork();
  })

} else {
  // work process main program - each CPU core runs by the one
    const url = require('url');
    const dbLayer  = require("./db");
    const sessionL = require("./sessions");
    const redisStore = require('./redisStore')
    const mysqlStore = require("./mySqlStore");
    const http= require("http");
    const myParser = require("./body_parser_json_urlenc");


    async function main_proc(){
      // Require the router module
    let registerRouter = require('./routes/register');
    let loginRouter = require('./routes/login');
    let validationRouter = require('./routes/validate');
      //body parser
      let bodyParser = new myParser.myBodyParser();
        //db pool init
        let rdbmsLayer = new dbLayer.MysqlLayer({basename:"my_bot", password:"65535258", user:"root", host:"localhost"});
        //when tables absent - create it:
        await rdbmsLayer.initDb();
        //**************************** */
        //create a storage for s e s s i o n s:
        /**
         
█░█░█ █░█ █▀▀ █▄░█   ▄▀█   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█   █▀ ▀█▀ █▀█ █▀█ █▀▀   ▄▄   █▀▄▀█ █▄█ █▀ █▀█ █░░ ▀
▀▄▀▄▀ █▀█ ██▄ █░▀█   █▀█   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█   ▄█ ░█░ █▄█ █▀▄ ██▄   ░░   █░▀░█ ░█░ ▄█ ▀▀█ █▄▄ ▄
         */
      let store = new mysqlStore.StorageOfSessions(rdbmsLayer.getMysqlPool());
      await store.init();
 /*
            
█░█░█ █░█ █▀▀ █▄░█   ▄▀█   █▀ █▀▀ █▀ █▀ █ █▀█ █▄░█   █▀ ▀█▀ █▀█ █▀█ █▀▀   ▄▄   █▀█ █▀▀ █▀▄ █ █▀ ▀
▀▄▀▄▀ █▀█ ██▄ █░▀█   █▀█   ▄█ ██▄ ▄█ ▄█ █ █▄█ █░▀█   ▄█ ░█░ █▄█ █▀▄ ██▄   ░░   █▀▄ ██▄ █▄▀ █ ▄█ ▄
 */
        //  let store = new redisStore.StorageSessioonsOnRedis();
       //   await  store.init();
        

        //create sessions factory
        let sessions = new sessionL(store);

        registerRouter.router.rdbmsLayer = rdbmsLayer;
        loginRouter.router.rdbmsLayer = rdbmsLayer;
        loginRouter.router.sessionLayer = sessions;
        validationRouter.router.sessions = sessions;
        /// a table of routes that a server is processing each request to find respective handler
        const tableOfRoutes ={
          "/hello":{proc:(req, res)=>{res.setHeader('Content-Type', 'text/plain'); res.end("word!"); }, method:"GET"},
          "/register/begin_registration":{proc:registerRouter.router.begin_registration, method:"POST"},
          "/register/register_finish":{proc:registerRouter.router.register_finish, method:"POST"},
          "/login":{proc:loginRouter.router.login, method:"POST"},
          "/logoff":{proc:validationRouter.router.logoff, method:"POST"},
          "/validate":{proc:validationRouter.router.validate, method:"POST"},
        }

      

        let  onRequest = async (req, res)=>{
          //parse body and store  as "req.body" : only JSON and urlencoded supported!
        await bodyParser.parseRequestsBody(req);
        let link =  url.parse(req.url, true);
        link = link.pathname;
        //search {proc: undefined, method: 'POST'}
        let routeProcedures = tableOfRoutes[link];
          if (routeProcedures) {
              //is a method proprely?
              if (routeProcedures.method == req.method) {
                await routeProcedures.proc(req, res);
              }else{
                res.writeHead(400);
                res.end("Bad request!");
              }    
          } else {
              res.setHeader('Content-Type', 'text/plain' );
              res.statusCode = 404;
              res.end('not found');  
          }

        }

          let server = http.createServer(onRequest);
          server.listen(8080, ()=>console.log("listen on 8080"))
      
    }

    main_proc();



    process.on("beforeExit", async()=>{
      await rdbmsLayer.closeDatabase();
      await store.deInit();
    })

}






