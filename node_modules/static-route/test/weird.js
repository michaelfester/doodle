var assert = require('assert');
var http = require('http');

var staticroute = require('../');

var host = 'localhost';
var port = 9128;

var server = http.createServer(staticroute());
server.listen(port, host, started);

function started() {
  console.log('server started');

  var file = encodeURIComponent('weird filename$?..\nnewline');
  http.request('http://localhost:9128/test/' + file, function(res) {
    console.log('GET /' + file);
    console.log('-> statusCode = %d', res.statusCode);
    console.dir(res.headers);
    assert(res.statusCode === 200);
    process.exit(0);
  }).end();
}
