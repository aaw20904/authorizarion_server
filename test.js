const redis = require('redis');
const crypto = require("crypto");

async function main () {

let keys=  await new Promise((resolve, reject) => {
            crypto.generateKeyPair('rsa', {
              modulusLength: 2048,
                publicKeyEncoding: {
                  type: 'spki',
                  format: 'pem',
              },
              privateKeyEncoding: {
                  type: 'pkcs8',
                  format: 'pem',
                  cipher: 'aes-256-cbc',
                  passphrase: "mouse"
                },
            
              }, (err, publicKey, privateKey) => {
                  if (err) {
                      reject(err);
                  } else {
                      
                      resolve({privateKey , publicKey});
                  }
              // Handle errors and use the generated key pair.
              });
          });

  console.log(Buffer.from(keys.privateKey).length, Buffer.from(keys.publicKey).length)
   /**  const client = redis.createClient({
      host:"192.168.0.121"
    });

    client.on('error', err => console.log('Redis Client Error', err));

    await client.connect();

    await client.set('key1', new Date().toLocaleTimeString());
    const value = await client.get('key');
    console.log(value);
    await client.disconnect();*/
}

main();