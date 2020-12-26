var assert = require('assert');

var cleanse = require('../');

// return a copy of an object
function copy(o) {
  return JSON.parse(JSON.stringify(o));
}

var dirtydata = {
  name: 'dave',
  toString: 'foo',
  hasOwnProperty: 'yes',
  arr: [
    {
      toString: 'bar'
    }
  ],
  obj: {
    toString: 'baz',
  }
};

var cleandata = {
  name: 'dave',
  arr: [
    {
    }
  ],
  obj: {
  }
};

var d;
console.log('ensuring cleanse(dirtydata) == cleandata');
d = cleanse(copy(dirtydata));
assert(d);
assert.deepEqual(d, cleandata);
console.log('done\n');
