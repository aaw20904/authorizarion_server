const querystring = require('querystring');
async function bodyParse(req,res){
    let payload =  await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
        data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        })
    });
    //when JSON:
    if(req.headers["content-type"] == "application/json" ){
        payload = JSON.parse(payload);
        //injected result
        req.body = payload;
        return true;
    }
    //when urlencoded:
    if(req.headers["content-type"] == "application/x-www-form-urlencoded"){
     let myData = querystring.parse(payload);
     ///injected result
     req.body = myData;
     return true; 
    } else {
        return false;
    }
}

module.exports = bodyParse;