Cleanse
=======

Remove reserved keys like hasOwnProperty, toString, etc. on objects recursively

Installation
------------

    npm install cleanse

Why?
----

Objects are great in JavaScript, but they are not hashes.  If you are not
careful, or accept data from untrusted sources, it's possible to override
prototype methods which can cause unwanted behavior.

Example

``` js
var d = {
  x: 5,
  toString: 'd'
};
console.log('%s', d);
```

Under normal circumstances, this would print `[object Object]`, as the `%s` given
to `console.log` is passed to `util.format`, which calls the `toString` method
of the object given and substitutes in the data returned.

However, because `toString` was overridden to be a string, it is now an error to
call `toString`, as it is no longer callable.  Running this code results in:

```
TypeError: Cannot convert object to primitive value
    at String (<anonymous>)
    at util.js:39:25
    at String.replace (native)
    at Console.exports.format (util.js:35:23)
    at Console.log (console.js:53:34)
    at repl:1:9
    at REPLServer.self.eval (repl.js:110:21)
    at repl.js:249:20
    at REPLServer.self.eval (repl.js:122:7)
    at Interface.<anonymous> (repl.js:239:12)
```

Take another example that mimics what you might see in a real-world node
server, and imagine the data was sent by a user being nefarious.

``` js
var d = {
  id: 5,
  hasOwnProperty: 'foo'
};
if (!d.hasOwnProperty('id'))
  console.log('property "id" must be supplied');
```

The logic is innocent enough; the code is attempting to ensure that the
user supplied the `id` key in the data they sent.  However, because the
"user" has overridden the `hasOwnProperty` property, this results in:

```
TypeError: Property 'hasOwnProperty' of object #<Object> is not a function
    at repl:1:8
    at REPLServer.self.eval (repl.js:110:21)
    at repl.js:249:20
    at REPLServer.self.eval (repl.js:122:7)
    at Interface.<anonymous> (repl.js:239:12)
    at Interface.EventEmitter.emit (events.js:95:17)
    at Interface._onLine (readline.js:202:10)
    at Interface._line (readline.js:531:8)
    at Interface._ttyWrite (readline.js:760:14)
    at ReadStream.onkeypress (readline.js:99:10)
```

---

In both of the examples given above, fatal errors were thrown that were not caught,
which would result in the node program terminating.

How
---

This module does not have a hardcoded list of reserved
keywords or inherited properties.  Instead, it looks inside an empty object
to figure out which keywords are inherited, and which are safe to use.  That
means this module will continue to work even if in the future it is decided
that more properties will be attached to the `Object` prototype and thus
made reserved.

I liked the way [JSON5-utils](https://github.com/rlidwka/json5-utils)
handled this problem, but I didn't want to have to use a separate JSON
parser just to get this functionality.

Usage
-----

``` js
var cleanse = require('cleanse');
cleanse(process.env);
```

### `cleanse(obj, behavior='ignore')`

`cleanse` will recursively scan an object or array given and clean any and all
reserved keys found in every object.  This method will also act as a noop if given
a string, number, boolean, etc. so it is safe to pass the returned data from
`JSON.parse` without first checking its type.

- `behavior`: specifies what to do with reserved keys
  - `ignore`: (default) silently discard reserved keys
  - `throw`: throw an error at the first reserved key found

``` js
cleanse({x: 5, hasOwnProperty: 'foo'});
// => {x: 5}
cleanse({x: 5, hasOwnProperty: 'foo'}, 'ignore')
// => {x: 5}

// throw will cause a SyntaxError to be thrown
cleanse({x: 5, hasOwnProperty: 'foo'}, 'throw')
// => SyntaxError: reserved keyword "hasOwnProperty" found in object
```

This is useful for objects that have already been parsed for you,
such as the output of `querystring.parse`, `req.headers`, `process.env`, etc.


**Note:** the object is modified in place, so it is not necessary to capture
the returned variable.

License
-------

MIT
