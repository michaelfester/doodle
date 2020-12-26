var assert = require('assert');
var fs = require('fs');
var path = require('path');

var cleanse = require('../');

var jsonfile = path.join(__dirname, 'example.json');
var data = fs.readFileSync(jsonfile, 'utf-8');
var o = JSON.parse(data);

// return a copy of an object
function copy(o) {
  return JSON.parse(JSON.stringify(o));
}

var d;
console.log('ensuring cleanse works as expected');
d = cleanse(copy(o));

assert(d);
assert.strictEqual(typeof d, 'object');
assert.strictEqual(d.whois, 'John Galt?');
assert.strictEqual(d.missing, true);
assert.strictEqual(d.location, null);
assert(Array.isArray(d.employment));
assert.strictEqual(d.employment[0], '20th Century Motor Company');
assert.strictEqual(d.employment[1], 'Taggart Transcontinental');
assert(Array.isArray(d.education));
assert.strictEqual(typeof d.education[0], 'object');
assert.strictEqual(d.education[0].school, 'Patrick Henry University');
assert.strictEqual(d.education[0].years, 4);
assert(Array.isArray(d.education[0].majors));
assert.strictEqual(d.education[0].majors[0], 'physics');
assert.strictEqual(d.education[0].majors[1], 'philosophy');
console.log('done\n');

console.log('ensuring cleanse(s, \'throw\') throws');
assert.throws(function() {
  cleanse(copy(o), 'throw');
});
console.log('done\n');

console.log('ensuring cleanse(s, \'ignore\') ignores keywords');
d = cleanse(copy(o), 'ignore');
assert.strictEqual(typeof d.toString, 'function');
assert.strictEqual(typeof d.hasOwnProperty, 'function');
assert.strictEqual(typeof d.education[0].toString, 'function');
console.log('done\n');

