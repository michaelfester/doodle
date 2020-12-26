static-route
============

A route for an http server to safely serve static files

*now supports streaming and ranges*

Installation
------------

    npm install static-route

Usage
-----

``` js
var http = require('http');
var staticroute = require('static-route');

// basic
http.createServer(staticroute());
// => this server will serve static files from `process.cwd()`
```

### Basic Invocation

``` js
var http = require('http');
var staticroute = require('static-route');
var callback = staticroute();

var server = http.createServer(callback);
server.listen(8080);
```

This server will serve static files out of your current directory with correct
response codes, headers, and etags. For example:

```
$ curl -i http://localhost:8080
HTTP/1.1 403 Forbidden
Date: Mon, 29 Apr 2013 19:25:42 GMT
Connection: keep-alive
Transfer-Encoding: chunked

$ curl -i http://localhost:8080/fake
HTTP/1.1 404 Not Found
Date: Mon, 29 Apr 2013 19:25:43 GMT
Connection: keep-alive
Transfer-Encoding: chunked

$ curl -i http://localhost:8080/package.json
HTTP/1.1 200 OK
Last-Modified: Mon, 29 Apr 2013 01:03:28 GMT
Content-Length: 494
Content-Type: application/json
ETag: "494-1367197408000"
Date: Mon, 29 Apr 2013 19:25:45 GMT
Connection: keep-alive

{
  "name": "static-route",
...
```

You can see a 403 was generated for the first request, as it was for a directory.

The second request generated a 404 as the asset does not exist.

The third request was successful, it generated the proper headers, complete
with `ETag`, `Last-Modified`, `Content-Length`, and `Content-Type` (from the
`mime` module).  Files are also served with `fs.createReadStream` so the entire
file contents are not read into memory before being sent to the client.

### Advanced Invocations

Using the code above and changing the callback line to:

``` js
var callback = staticroute('/');
```

```
$ curl -i http://localhost:8080/etc/passwd
HTTP/1.1 200 OK
Last-Modified: Wed, 22 Feb 2012 00:57:33 GMT
Content-Length: 5148
Content-Type: application/octet-stream
ETag: "5148-1329872253000"
Date: Mon, 29 Apr 2013 19:31:20 GMT
Connection: keep-alive

root:*:0:0:root:/root:/bin/sh
...
```

Static files are being served from `/`, I wouldn't recommend doing this.

Same thing as a above, modifying the callback line:

``` js
var callback = staticroute({dir: process.cwd(), autoindex: true, logger: function() {}})
```

This will serve out of your current directory (default behavior), with directory indexing enabled,
and no logging.

```
$ curl -i http://localhost:8080/
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Date: Mon, 29 Apr 2013 19:37:13 GMT
Connection: keep-alive
Transfer-Encoding: chunked

<ul>
<li><a href="/">.</a></li>
<li><a href="/">..</a></li>
<li><a href="/REAMDE.md">REAMDE.md</a></li>
<li><a href="/examples">examples</a></li>
<li><a href="/node_modules">node_modules</a></li>
<li><a href="/package.json">package.json</a></li>
<li><a href="/static-route.js">static-route.js</a></li>
<li><a href="/test">test</a></li>
</ul>

$ curl -i http://localhost:8080/?json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Date: Mon, 29 Apr 2013 19:37:16 GMT
Connection: keep-alive
Transfer-Encoding: chunked

[".", "..", "REAMDE.md","examples","node_modules","package.json","static-route.js","test"]
```

Add `?json` to directory requests to get JSON instead of HTML if `autoindex` is enabled

### Logging

By default, any and all error messages from filesystem functions are logged
with `console.error`, this behavior can be changed, see below:

Functions
---------

### `staticroute([opts])`

The main export of the module.  This function, when called, returns a **function**
suitable for an http server request callback.

`opts` is an optional object that contains configuration variables.  `opts` can also
be set to a string of the path to use to server static files.

`opts`:

- `dir`: The dir to serve static files from, defaults to `process.cwd()`
- `autoindex`: If true, a request to a directory will return an index page for
the contents.  If false or unset, a request to a directory will return a 403.  Defaults to false
- `logger`: The function to use to log error messages, defaults to `function () {}`
- `tryfiles`: An array (defaults to `[]`) of files to try first, like NGINX. For example, set `opts.tryfiles = ['index.html']` to
serve an index page if it exists
- `slice`: A prefix to `req.url` to slice off

### `function(req, res)`

The function returned from the above function.  This function takes the `req` and `res`
object from an http(s) server connection callback, and serves static contents.

Security
--------

Path names are normalized and correctly joined (no regex, string manipulation, etc).  The `path` module
and built in decoding functions are used to correctly parse the web addresses supplied.

```
$ curl -i http://localhost:8080/../../../../../../../etc/passwd
HTTP/1.1 404 Not Found
Date: Mon, 29 Apr 2013 19:39:54 GMT
Connection: keep-alive
Transfer-Encoding: chunked
```

and on the server

```
ENOENT, stat '/Users/dave/dev/node-static-route/etc/passwd'
```

Directory traversal is not possible, this module is stuck inside the directory you supply (or cwd).
Go ahead, try it.

```
$ curl -i http://localhost:8080/%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd
HTTP/1.1 404 Not Found
Date: Mon, 29 Apr 2013 21:50:46 GMT
Connection: keep-alive
Transfer-Encoding: chunked
```

and on the server

```
ENOENT, stat '/Users/dave/dev/node-static-route/%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd'
```

Notes
-----

I take security seriously.  If this module has any security holes, then this module has bugs.
Please report any and all security holes or bugs you find, or even better pull request a fix.

License
-------

MIT
