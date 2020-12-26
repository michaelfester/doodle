var assert = require('assert');
var http = require('http');

var easyreq = require('../');

var host = 'localhost';
var port = 9128;

var NUM_CHECKS = 0;

var httprequest = http.request.bind(http);
http.request = function() {
  NUM_CHECKS++;
  return httprequest.apply(http, arguments);
};

http.createServer(onrequest).listen(port, host, started);

function onrequest(req, res) {
  easyreq(req, res);

  switch (req.urlparsed.pathname) {
    case '/redirect':
      res.redirect('http://google.com');
      break;
    case '/notfound':
      res.notfound();
      break;
    case '/notfounddata':
      res.notfound('foo');
      break;
    case '/error':
      res.error();
      break;
    case '/errorcode':
      res.error(501);
      break;
    case '/errordata':
      res.error('bar');
      break;
    case '/errorboth':
      res.error(502, 'baz');
      break;
    case '/json':
      res.json({key:'value'});
      break;
    case '/html':
      res.html('<html></html>');
      break;
    default:
      res.notfound('no route found');
      break;
  }
}

function started() {
  console.log('server started');
  var i = 0;

  http.request('http://localhost:9128/redirect', function(res) {
    console.log('GET /redirect');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 302);
    console.log('-> location header = %s', res.headers.location);
    assert(res.headers.location === 'http://google.com');
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /notfound) body = "%s"', data);
      assert(data === http.STATUS_CODES[302] + '\n');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/notfound', function(res) {
    console.log('GET /notfound');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 404);
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /notfound) body = "%s"', data);
      assert(data === http.STATUS_CODES[404] + '\n');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/notfounddata', function(res) {
    console.log('GET /notfounddata');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 404);
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /notfounddata) body = "%s"', data);
      assert(data === 'foo');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/error', function(res) {
    console.log('GET /error');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 500);
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /error) body = "%s"', data);
      assert(data === http.STATUS_CODES[500] + '\n');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/errorcode', function(res) {
    console.log('GET /errorcode');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 501);
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /errorcode) body = "%s"', data);
      assert(data === http.STATUS_CODES[501] + '\n');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/errordata', function(res) {
    console.log('GET /error');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 500);
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /errordata) body = "%s"', data);
      assert(data === 'bar');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/errorboth', function(res) {
    console.log('GET /error');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 502);
    var data = '';
    res.setEncoding('utf-8');
    res.on('data', function(d) { data += d; });
    res.on('end', function() {
      console.log('(GET /errorboth) body = "%s"', data);
      assert(data === 'baz');
      checkdone();
    });
  }).end();

  http.request('http://localhost:9128/html', function(res) {
    console.log('GET /html');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 200);
    console.log('-> Content-Length = %d', res.headers['content-length']);
    assert(res.headers['content-length'], '<html></html>'.length);
    checkdone();
  }).end();

  http.request('http://localhost:9128/json', function(res) {
    console.log('GET /json');
    console.log('-> statusCode = %d', res.statusCode);
    assert(res.statusCode === 200);
    console.log('-> Content-Length = %d', res.headers['content-length']);
    assert(res.headers['content-length'], (JSON.stringify({key:'value'}) + '\n').length);
    checkdone();
  }).end();

  function checkdone() {
    if (++i >= NUM_CHECKS)
      process.exit(0);
  }
}
