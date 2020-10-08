require('dotenv').config();
var express = require('express');
var app = express();

// ....... other express endpoints as per your project
app.get('/', function (req, res) {
  res.send('Bot activo!');
});
app.get('/out', function (req, res) {
  res.sendfile('out.log');
});
app.get('/err', function (req, res) {
  res.sendfile('err.log');
});

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

const FCFSClient = require('./src/fcfsclient');

const client = new FCFSClient();

client.start();


async function saveAndExit() {
  console.log('Saving...');
  try {
    await client.dataSource.save();
    console.log('Data Saved.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR! Exiting forcefully.');
    process.exit(1);
  }
}

process.on('SIGINT', saveAndExit);

process.on('message', (msg) => {
  if (msg === 'shutdown') saveAndExit();
});
