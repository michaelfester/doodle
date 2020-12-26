var http = require('http');

var staticroute = require('../');

var host = 'localhost';
var port = 9128;

var server = http.createServer(staticroute({autoindex: true}));
server.listen(port, host, started);

function started() {
  console.log('server started http://%s:%d/', host, port);
}
