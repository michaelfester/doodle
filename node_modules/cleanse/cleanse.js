var EMPTY_OBJECT = {};

module.exports = cleanse;

// scan through an object/array/etc. recursively,
// and remove any reserved key / prototype methods
// that have been overridden
function cleanse(obj, behavior) {
  var i;
  if (Array.isArray(obj)) {
    // cleanse every element in an array
    for (i in obj) {
      obj[i] = cleanse(obj[i], behavior);
    }
  } else if (typeof obj === 'object') {
    // cleanse every item in an object, checking to see if the item
    // is valid by comparing its existence to an empty object literal
    for (i in obj) {
      if (i in EMPTY_OBJECT) {
        // reserved keyword found, figure out what to do
        switch (behavior) {
          case 'throw':
            throw new SyntaxError('reserved keyword "' + i + '" found in object');
            break;
          case 'ignore':
          default:
            delete obj[i];
            break;
        }
      } else {
        // not a reserved keyword, just cleanse it like normal
        obj[i] = cleanse(obj[i], behavior);
      }
    }
  }
  return obj;
}
