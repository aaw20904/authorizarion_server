const express = require('express')
const dbLayer  = require("./db");

async function main(){
    let rdbmsLayer = new dbLayer({basename:"my_bot",password:"65535258",user:"root",host:"localhost"});
    await rdbmsLayer.initDb();
    await rdbmsLayer.createNewUser({name:"Wasya",password:"123",email:"wasya@mail.ru",picture:"jpeeeeg"});
    await rdbmsLayer.closeDatabase();
}

main();



