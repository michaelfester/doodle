var assert = require('assert');
var http = require('http');

var staticroute = require('../');

var host = 'localhost';
var port = 9128;

var server = http.createServer(staticroute());
server.listen(port, host, started);

function started() {
  console.log('server started');

  http.request('http://localhost:9128/../../../../../../../../etc/passwd', function(res) {
    console.log('GET /../../../../../../../etc/passwd');
    console.log('-> statusCode = %d', res.statusCode);
    console.dir(res.headers);
    assert(res.statusCode === 404);
    process.exit(0);
  }).end();
}
