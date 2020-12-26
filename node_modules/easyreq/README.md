easyreq
=======

Add convenience function to the `req` and `res` objects of an http/https server

Install
-------

    npm install easyreq

Example
-------

Use `easyreq` to decorate the `req` and `res` objects of a server

``` js
var http = require('http');
var easyreq = require('easyreq');

http.createServer(function(req, res) {
  easyreq(req, res); // call easyreq to overload these object with new methods

  console.log(req.urlparsed); // the output of url.parse(req.url, true);

  res.error(); // end the connection with a 500

  res.notfound(); // end the connection with a 404

  res.redirect('http://www.google.com'); // end the connection with a 302 redirect to google
});
```

### `req.urlparsed`

The output of `url.parse(req.url, true)`.  Additional keys are also available:

- `req.urlparsed.normalizedpathname`: the output of
  `path.normalize(req.urlparsed.pathname)`; used to help prevent directory
  traversal attacks against your webserver.
- `req.urlparsed.query`: this object has been
  [cleansed](https://www.github.com/bahamas10/node-cleanse) of reserved
  keywords

### `res.error([code], [s])`

End the connection with a given code which defaults to 500.  This allows for
simple one-liners like:

``` js
if (err)
  return res.error();
```

The second argument is an optional string to pass to `res.end()`, if it is not supplied,
the data will be set to `http.STATUS\_CODES[code]`

Examples

``` js
// send a 500 with the body set to "Internal Server Error" (http.STATUS_CODES[500])
res.error();

// send a 501 with the body set to "Not Implemented" (http.STATUS_CODES[501])
res.error(501);

// send a 500 with the body set to "foo"
res.error('foo');

// send a 503 with the body set to "bar"
res.error(503, 'bar');
```

### `res.notfound()`

Like `res.error()` above, this will end the connection with a 404.  Again this
allows for simple one-liners like:

``` js
if (!route)
  return res.notfound();
```

Any arguments passed to `res.notfound()` will be applied to the `res.end()`
function.

### `res.redirect(url, [code])`

Send a 302 redirect to the given URL and end the connection.

The optional second argument is the code to send, defaults to `302`

### `res.json(obj, [code], [pretty])`

End the request by sending an object as JSON.  `obj` is automatically stringified,
the `Content-Type` header is set if it is not currently set.

`Code` is optional and defaults to 200

**Note:** this function can throw if the object cannot be stringified

### `res.html(html, [code])`

End the request by sending HTML. `Content-Type` header is set if it is
not currently set.

`Code` is optional and defaults to 200

License
-------

MIT
