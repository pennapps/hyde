/* Given a snippet of html, returns a Javascript representation of the document structure
 * Returns a messy-yet-sematically-simply javascript object consisting of nested arrays and strings
 *   Each heading is an array with its text and its id (useful for # url fragments) as its first
 *   and second elements respectively. The following elements are heading children
 * Requires a strict heirarchy, meaning must start with h1 and cannot skip over levels (h3 can not follow h1)
 * Based *loosely* off of thlorenz's doctoc/lib/get-html-headers.js
 */

var htmlparser = require('htmlparser2');

// ignore headings greater than this level
var maxLevel = 4;

module.exports = function getStructure(html) {
  var output = null;
  var heirarchyStack = [];
  var current = null;

  var currentTagName = null;

  var parser = new htmlparser.Parser({
    onopentag: function (name, attribs) {
      // check if heading tag
      if (name.match(/^h\d$/i)) {
        var level = parseInt(name.substring(1,2));

        if (level > 0 && level <= maxLevel) {
          
          
          if (level === 1) {
            // expect first heading to be H1
            if (output !== null) {
              throw new Error('Unexpected <h1>');
            }
            output = current = [];
            heirarchyStack.push(current);
          } else if (output === null) {
            throw new Error('Expected <h1>');
          } else {
            var parent = null;
            var prevLevel = heirarchyStack.length + 1;

            if (level === prevLevel) {
              // encountered sibling
              parent = heirarchyStack[heirarchyStack.length - 1];
            } else if (level === prevLevel + 1) {
              // encountered child
              heirarchyStack.push(current);

              parent = current;
            } else if (level === prevLevel - 1) {
              // jump up
              heirarchyStack.pop();
              parent = heirarchyStack[heirarchyStack.length - 1];
            } else {
              throw new Error('Illegal structure. Jumping from level ' + prevLevel + ' to ' + level);
            }

            current = []
            parent.push(current);;
          }

          currentTagName = name.toLowerCase();
          // add in text and id
          current.push('');
          current.push(attribs.id)
        }
      }
      if(name === 'script' && attribs.type === "text/javascript"){
        console.log("JS! Hooray!");
      }
    },
    ontext: function (text) {
      if (currentTagName) {
        current[0] += text;
      }
    },
    onclosetag: function (tagname) {
      if (tagname.toLowerCase() === currentTagName) {
        currentTagName = null;
      }
    }
  }, {decodeEntities: true});

  parser.write(html);
  parser.end();

  return output;
}