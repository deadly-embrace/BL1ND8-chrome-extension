import express from 'express';
import { ecdh, randomPrivate, pubFromPriv, sharedSecret, chachaSetup, chachaFill, hexToBytes } from './cupidcrypt';

const app = express();
const port = 8080;

const publicKey = 'bb6c5d799d78e16667921780acae99219c0bf980e9a7b17de8ea3b1891db1e96d0fb53c4a0d9fbc50367efb926a275b249d1633ad1bf1b5e';
const privateKey = '<our secret key from secrets store>';

const hexVals = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15};

const waitingForConnection = new Set();

app.get('/', (req, res) => {

  if(!req.headers.singularity) {
    res.status(400).send('Bad request, no header!');
    return;
  }
  if(req.headers.singularity.length < 124) {
    res.status(400).send('Bad request, improperly formed header!');
    return;
  }

  let pubkey = req.headers.singularity.slice(0, 112); //112
  let sekrit = sharedSecret(privateKey, pubkey);
  
  const commkey = new Uint32Array(16);

  const tkey = new Uint32Array(8);

  for(let i = 0; i < 8; i++) {
    let j = i << 2;
    tkey[i] = sekrit[j] & 255;
    tkey[i] += (sekrit[j + 1] & 255) << 8;
    tkey[i] += (sekrit[j + 2] & 255) << 16;
    tkey[i] += (sekrit[j + 3] & 255) << 24;
  }

  const nonce = new Uint32Array(6);

  for(let i = 0; i < 6; i++) {
    let j = 32 + (i << 2);
    nonce[i] = sekrit[j] & 255;
    nonce[i] += (sekrit[j + 1] & 255) << 8;
    nonce[i] += (sekrit[j + 2] & 255) << 16;
    nonce[i] += (sekrit[j + 3] & 255) << 24;
  }

  chachaSetup(commkey, tkey, nonce, 0); 

  let commBuff = Buffer.from(new ArrayBuffer(256));

  chachaFill(commkey, commBuff, 4);
  
  let deets = hexToBytes(req.headers.singularity.slice(112, 122)); //10
  for(let i = 0; i < 5; i++) deets[i] ^= commBuff[i];
  let gender = deets[0] & 15;
  let genderMat = 1 << gender;
  let genderComp = deets[1] * 16 + (deets[0] >>> 4);
  let age = deets[2];
  let ageMin = deets[3];
  let ageMax = deets[4];
  if(age < 18) {
    res.status(403).send('You must be 18 to use this app!');
    return;
  }
  if(ageMin < 18) {
    res.status(403).send('Stop being a perv. We reserve the right to forward your information to law enforcement authorities!');
    return;
  }
  if(ageMin > ageMax) {
    res.status(400).send('Your parameters make no sense!');
    return;
  }
  let connString = hexToBytes(req.headers.singularity.slice(122));
  for(let i = 0; i < connString.length; i++) connString[i] ^= commBuff[i + 5];

  waitingForConnection.add({gender: })



  // let commkey = req.headers.singularity.slice(112, 176);  //64
  // console.log("commkey:", commkey);

  // let nonce = req.headers.singularity.slice(176, 224); //48
  // console.log("nonce:", nonce);

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