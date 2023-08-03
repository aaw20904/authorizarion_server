const http = require("http");
const url = require("url");
const parser = require("./body_parser_json_urlenc");
const myParser = new parser.myBodyParser();
/**
 req.headers["content-length"]  - read the header
 req.url -  property with the path. For example "/users/registration/"
 */

const onMainRequest = async (req,res)=>{
  res.statusCode = 200;
  console.log(req.headers["content-type"]);
  res.setHeader('Content-Type', 'application/json');
  //parse body
    let rawBody =  await myParser.firstlyRead(req);
    myParser.finalyParse(req,rawBody);
  res.end(JSON.stringify({time: Date.now(), method: req.method, type: req.headers["content-type"] , parsed:req.body, url:req.url}));
}

let server = http.createServer(onMainRequest);
server.listen(8080,()=>console.log("isten on 8080..."));
