/**
 * add functions to req and res objects for an http/https server
 *
 * Author: Dave Eddy <dave@daveeddy.com>
 * Date: 4/19/2013
 * License: MIT
 */

var http = require('http');
var path = require('path');
var url = require('url');

var cleanse = require('cleanse');

module.exports = easyreq;

function easyreq(req, res) {
  // parse the URL, normalize the pathname and cleanse the querystring
  req.urlparsed = url.parse(req.url, true);
  req.urlparsed.normalizedpathname = path.normalize(req.urlparsed.pathname);
  cleanse(req.urlparsed.query);

  // easily send a redirect
  res.redirect = function easyreq_redirect(uri, code) {
    res.setHeader('Location', uri);
    res.statusCode = code || 302;
    res.end(http.STATUS_CODES[res.statusCode] + '\n');
  };

  // shoot a server error or end with a code
  res.error = function easyreq_error(code, s) {
    if (typeof code !== 'number') {
      s = code;
      code = 500;
    }
    res.statusCode = code;

    if (s !== undefined)
      res.end(s);
    else
      res.end(http.STATUS_CODES[res.statusCode] + '\n');
  };

  // 404 to the user
  res.notfound = function easyreq_notfound(s) {
    res.statusCode = 404;

    if (s !== undefined)
      res.end.apply(res, arguments);
    else
      res.end(http.STATUS_CODES[res.statusCode] + '\n');
  };

  // send json
  res.json = function easyreq_json(obj, code, pretty) {
    var content;
    if (pretty)
      content = JSON.stringify(obj, null, 2) + '\n';
    else
      content = JSON.stringify(obj);
    if (!res.getHeader('Content-Type'))
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (!res.getHeader('Content-Length'))
      res.setHeader('Content-Length', Buffer.byteLength(content, 'utf-8'));
    if (code)
      res.statusCode = code;

    res.end(content);
  };

  // send html
  res.html = function easyreq_html(html_, code) {
    if (!res.getHeader('Content-Type'))
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!res.getHeader('Content-Length'))
      res.setHeader('Content-Length', Buffer.byteLength(html_, 'utf-8'));
    if (code)
      res.statusCode = code;

    res.end(html_);
  };
}
