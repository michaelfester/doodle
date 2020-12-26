/**
 * create a static route
 */
var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');

var he = require('he');
var mime = require('mime');
var easyreq = require('easyreq');

module.exports = main;


// exported function to give a static route function
function main(opts) {
  opts = opts || {};
  if (typeof opts === 'string') {
    opts = { dir: opts };
  }
  opts.tryfiles = [''].concat((opts.tryfiles || []).reverse());

  var logger = opts.logger || function() {};

  return staticroute;

  // static serving function
  function staticroute(req, res) {
    easyreq(req, res);

    // copy the array
    var tryfiles = opts.tryfiles.slice(0);

    // decode everything, and then fight against dir traversal
    var reqfile;
    try {
      reqfile = path.normalize(decodeURIComponent(req.urlparsed.pathname));
    } catch (e) {
      res.error(400);
      return;
    }

    // slice off opts.slice
    if (opts.slice && reqfile.indexOf(opts.slice) === 0)
      reqfile = reqfile.substr(opts.slice.length);

    // unsupported methods
    if (['HEAD', 'GET'].indexOf(req.method) === -1)
      return res.error(501);

    var f = path.join((opts.dir || process.cwd()), reqfile);

    tryfile();
    function tryfile() {
      var file = path.join(f, tryfiles.pop());

      // the user wants some actual data
      fs.stat(file, function(err, stats) {
        if (err) {
          logger(err.message);
          if (tryfiles.length)
            return tryfile();

          if (err.code === 'ENOENT')
            res.notfound();
          else
            res.error(500);
          return;
        }

        if (stats.isDirectory()) {
          // directory
          // forbidden
          if (!opts.autoindex)
            return res.error(403);

          // json stringify the dir
          statall(file, function(e, files) {
            if (e) {
              logger(e.message);
              res.error(500);
              return;
            }
            files = files.map(function(_file) {
              return _file.filename + (_file.directory ? '/' : '');
            });
            files.sort(function(a, b) {
              a = a.toLowerCase();
              b = b.toLowerCase();
              var adir = a.indexOf('/') > -1;
              var bdir = b.indexOf('/') > -1;
              if (adir && !bdir)
                return -1;
              else if (bdir && !adir)
                return 1;
              return a < b ? -1 : 1;
            });
            if (hap(req.urlparsed.query, 'json')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.write(JSON.stringify(files));
            } else {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              writehtml(res, req.urlparsed.pathname, files);
            }
            res.end();
          });
        } else {
          // file
          var etag = util.format('"%d-%d"', stats.size, stats.mtime.getTime());
          res.setHeader('Last-Modified', stats.mtime.toUTCString());
          res.setHeader('Content-Type', mime.lookup(file));
          res.setHeader('ETag', etag);

          // check cache and range
          var range = req.headers.range;
          if (req.headers['if-none-match'] === etag) {
            // etag matched, end the request
            res.error(304);
          } else if (range) {
            // range transfer
            var parts = range.replace('bytes=', '').split('-');
            var partialstart = parts[0];
            var partialend = parts[1];

            var startrange = parseInt(partialstart, 10);
            var endrange = partialend ? parseInt(partialend, 10) : stats.size - 1;
            if (!startrange)
              startrange = 0;
            if (!endrange)
              endrange = stats.size - 1;
            var chunksize = endrange - startrange + 1;

            if (endrange <= startrange) {
              res.error(416);
              return;
            }

            res.statusCode = 206;
            res.setHeader('Content-Range', 'bytes ' + startrange + '-' + endrange + '/' + stats.size);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', chunksize);
            if (req.method === 'HEAD') {
              res.end();
            } else {
              var rs = fs.createReadStream(file, {start: startrange, end: endrange});
              rs.pipe(res);
              rs.on('error', function(e) {
                if (e.code === 'ENOENT')
                  res.notfound();
                else
                  res.error(500);
              });
              res.on('close', rs.destroy.bind(rs));
            }
          } else {
            // no range
            res.setHeader('Content-Length', stats.size);
            if (req.method === 'HEAD') {
              res.end();
            } else {
              var rs = fs.createReadStream(file);
              rs.pipe(res);
              rs.on('error', function(e) {
                if (e.code === 'ENOENT')
                  res.notfound();
                else
                  res.error(500);
              });
              res.on('close', rs.destroy.bind(rs));
            }
          }
        }
      });
    }
  }
}

// stat all files in a directory (non-recursively) and call back with
// an array of all stat objects
function statall(dir, cb) {
  var files = [];
  fs.readdir(dir, function(err, d) {
    if (err) {
      cb(err);
      return;
    }
    d = ['..'].concat(d);

    var i = 0;
    d.forEach(function(file) {
      fs.stat(path.join(dir, file), function(_err, stats) {
        i++;
        if (!_err) {
          stats.filename = file;
          stats.directory = stats.isDirectory();
          files.push(stats);
        }
        if (i === d.length)
          cb(null, files);
      });
    });
  });
}

// given a `res` object, base dir, and files array, write HTML
// to the receiving end
function writehtml(res, base, files) {
  var title = he.encode(util.format('Index of %s', base));
  res.write('<!doctype html><html><head><title>\n');
  res.write(title);
  res.write('\n</title></head><body>\n');
  res.write(util.format('<h1>%s</h1>', title));
  res.write('<hr />\n');
  res.write('<ul style="list-style: none; font-family: monospace;">\n');
  files.forEach(function(file) {
    var linktext = file;
    var linkhref = path.join(base, file);
    res.write(util.format('<li><a href="%s">%s</a></li>\n',
        he.encode(linkhref), he.encode(linktext)));
  });
  res.write('</ul>\n');
  res.write('<hr />\n');
  res.write('</body></html>\n');
}

function hap(o, p) {
    return ({}).hasOwnProperty.call(o, p);
}
