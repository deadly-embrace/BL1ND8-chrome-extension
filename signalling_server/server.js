const express = require('express')
const app = express()
const port = 8080

app.get('/', (req, res) => {

  if(!req.headers.singularity) {
    res.status(400).send('Bad request, no header!');
    return;
  }
  if(req.headers.singularity.length < 148) {
    res.status(400).send('Bad request, improperly formed header!');
    return;
  }

  let pubkey = req.headers.singularity.slice(0, 92); //92
  console.log("pubkey:", pubkey);

  let commkey = req.headers.singularity.slice(92, 135);  //43
  console.log("commkey:", commkey);

  let nonce = req.headers.singularity.slice(135, 146); //11
  console.log("nonce:", nonce);

  let stop;

  for(let i = 146; i < req.headers.singularity.length; i++) {
    if (req.headers.singularity[i] == '*'){
      stop = i;
      break;
    }
  }

  let encryptedConnectionString = req.headers.singularity.slice(146, stop); 
  console.log("encryptedConnString:", encryptedConnectionString);

  let encryptedDeets = req.headers.singularity.slice(++stop);  
  console.log("encryptedDeets:", encryptedDeets);

  // do real stuff here: 
  /*


  */

  // placeholder crap here:

    nonce = ''; //11
    let encryptedStreamingKey = ''; //43
    let encryptedPartnerDeets = '';
    let encryptedPartnerConnectionString = '';

    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for(let i = 0; i < 11; i++) nonce += chars[Math.random() * 64 | 0];
    for(let i = 0; i < 43; i++) encryptedStreamingKey += chars[Math.random() * 64 | 0];
    for(let i = 0; i < 200; i++) encryptedPartnerDeets += chars[Math.random() * 64 | 0];
    for(let i = 0; i < 60; i++) encryptedPartnerConnectionString += chars[Math.random() * 64 | 0];

  res.json(nonce + encryptedStreamingKey + encryptedPartnerConnectionString + '*' + encryptedPartnerDeets);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});