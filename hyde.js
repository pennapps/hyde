var path = require('path');

if (process.argv.length != 4) {
  throw new Exception('Expected two arguments.\n'
    + 'Usage: node hyde <source directoy> <target directory>');
}

var source = process.argv[2];
var target = process.argv[3];

//Load in global variables
var config = path.join(source, '.hyde.json');

//Build main jade template

//Build pages

