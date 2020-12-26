var http = require('http');

var easyreq = require('../');

var host = 'localhost';
var port = 8080;

http.createServer(onrequest).listen(port, host, started);

function onrequest(req, res) {
  easyreq(req, res);

  switch (req.urlparsed.pathname) {
    case '/redirect':
      res.redirect('http://google.com');
      break;
    case '/fake':
      res.notfound();
      break;
    case '/error':
      res.error();
      break;
    case '/json':
      res.json({key:'value'});
      break;
    case '/html':
      res.html('<html></html>');
      break;
    case '/query':
      res.json(req.urlparsed.query);
      break;
    default:
      res.end('path = ' + req.urlparsed.normalizedpathname);
      break;
  }
}

function started() {
  console.log('server started, http://%s:%d', host, port);
}
