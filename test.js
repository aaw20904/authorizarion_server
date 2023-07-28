const redis = require('redis');
async function main(){
  let client  = redis.createClient();
  
  await client.connect();
  //create - exp in sec
  //await client.set("mykey2","123",{EX:120, NX:true});
  //timeout in sec
  await client.expire("mykey2", 200, "XX");
  console.log( await client.exists('mykey2'));
  await client.quit();
}
main();