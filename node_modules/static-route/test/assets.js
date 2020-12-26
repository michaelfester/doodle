var assert = require('assert');
var http = require('http');

var staticroute = require('../')({
  dir: './assets',
  slice: '/assets'
});

var host = 'localhost';
var port = 9128;

process.chdir(__dirname);

var server = http.createServer(onrequest);
server.listen(port, host, started);

function onrequest(req, res) {
  if (req.url.indexOf('/assets/') === 0)
    return staticroute(req, res);

  res.statusCode = 404;
  res.end();
}

function started() {
  console.log('server started');

  var checks = 1;
  var i = 0;
  http.request('http://localhost:9128/assets/file.txt', function(res) {
    console.log('GET /assets/file.txt');
    console.log('-> statusCode = %d', res.statusCode);
    console.dir(res.headers);
    assert(res.statusCode === 200);
    if (++i >= checks) process.exit(0);
  }).end();
}
