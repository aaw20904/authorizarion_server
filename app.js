const express = require('express')
const dbLayer  = require("./db");
const sessionL = require("./sessions");

async function m256(){
// Generate Key Pair

    
    let rdbmsLayer = new dbLayer({basename:"my_bot",password:"65535258",user:"root",host:"localhost"});
    let sessions = new sessionL();
    sessions.storage = rdbmsLayer;
  
    await rdbmsLayer.initDb();
      console.log(await sessions.createNewSession(1));

    try{
        await rdbmsLayer.createNewUser({name:"Wasya",password:"123",email:"wasya@mail.ru",picture:"jpeeeeg"});
    }catch(e){
        if(e.alrEx){
            console.log("User Already exists!")
        } else {
            throw new Error(e);
        }
    }
   
    //console.log(await sessions.createNewSession(4));
    let a ="12"
    console.log(await rdbmsLayer.getUserByEmail(a));
    await rdbmsLayer.closeDatabase();

}

m256();



