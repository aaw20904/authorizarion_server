const querystring = require('querystring');

class myBodyParser {
    constructor(){
        //empty constructor
    } 
     
     //call this method FIRSTLY to read raw body`s data
    async   firstlyRead(req) {
    return new Promise((resolve, reject) => {
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
    finalyParse(req, payload) {
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
 
}





module.exports = {myBodyParser};