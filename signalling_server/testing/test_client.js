const fetch = require('node-fetch');

let pubkey = '';  //92
let commkey = '';  //43
let nonce = ''; //11
let encryptedConnectionString = ''; 
let encryptedDeets = '';

let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

for(let i = 0; i < 92; i++) pubkey += chars[Math.random() * 64 | 0];
console.log("pubkey:", pubkey);

for(let i = 0; i < 43; i++) commkey += chars[Math.random() * 64 | 0];
console.log("commkey:", commkey);

for(let i = 0; i < 11; i++) nonce += chars[Math.random() * 64 | 0];
console.log("nonce:", nonce);

for(let i = 0; i < 60; i++) encryptedConnectionString += chars[Math.random() * 64 | 0];
console.log("encryptedConnString:", encryptedConnectionString);

for(let i = 0; i < 200; i++) encryptedDeets += chars[Math.random() * 64 | 0];
console.log("encryptedDeets:", encryptedDeets);


fetch('http://localhost:8080/', {
        headers: { 'Singularity': pubkey + commkey + nonce + encryptedConnectionString + '*' + encryptedDeets },
    })
    .then(res => res.json())
    .then(json => {
        console.log("We received:", json);
        process.exit(0);
    });