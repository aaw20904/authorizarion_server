const http = require("http");
const url = require("url");
const myParser = require("./body_parser_json_urlenc");

const onMainRequest = async (req,res)=>{
  res.statusCode = 200;
  console.log(req.headers["content-type"]);
  res.setHeader('Content-Type', 'application/json');
 await myParser(req, res);
    /*let payload =  await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
            data += chunk;
            });
            req.on('end', () => {
                resolve(data);
            })
        });
    if(req.headers["content-type"] == "application/json" ){
        payload = JSON.parse(payload);
        console.log(payload);
    }*/
  res.end(JSON.stringify({time: Date.now(), method: req.method, type: req.headers["content-type"] , parsed:req.body, url:req.url}));
}




let server = http.createServer(onMainRequest);
server.listen(8080,()=>console.log("isten on 8080..."));
