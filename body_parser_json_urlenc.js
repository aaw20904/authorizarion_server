const querystring = require('querystring');
const url = require('url');
class myBodyParser {
    constructor(){
        //empty constructor
    } 
     
     //call this method FIRSTLY to read raw body`s data
    async   _firstlyRead(req) {
    return new Promise((resolve, reject) => {
        //read body length
            let contentLength = req.headers["content-length"];
                    // If there is no content length or it's 0, there is no request body
            if (isNaN(contentLength) || contentLength == '0') {
                resolve(false);
                return;
            }
            let result = "";

            req.on("data", (chunk)=>{
                result += chunk;
            });

            req.on("end", ()=>{
                resolve(result);

            })

            req.on("error", (e)=>{
                reject(e);
            })
        });
    }
    //call this method AFTER first - to parse raw body
    _finalyParse(req, payload) {
        if(!payload){
            return false;
        }
        switch (req.headers["content-type"]) {
            case "application/json":
                payload = JSON.parse(payload);
                //injects a result into request object
                req.body = payload;
            break;
            case "application/x-www-form-urlencoded":
                let myData = querystring.parse(payload);
                ///injects a result into a requesrt object
                req.body = myData;
            break;
            default:
            return false;
        }
        return true;
    }

    async parseRequestsBody(req) {
        //parse request 
        let parsedUrl  = url.parse(req.url, true);
        if (Object.keys(parsedUrl.query).length !== 0 ) {
            req.body= parsedUrl.query;
            return;
        }

        let rawData = await this._firstlyRead(req);
        if(!rawData){
            req.body = false;
        }else {
            this._finalyParse(req, rawData);
        }
    }
 
}





module.exports = {myBodyParser};