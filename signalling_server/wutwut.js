import express from 'express';

const app = express();
const port = 8080;

const waitingForConnection = new Set();

app.get('/', (req, res) => {
    waitingForConnection.add(Math.random());
    res.json("" + waitingForConnection.size);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });