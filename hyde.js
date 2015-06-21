#! /usr/bin/env node

var path = require('path');
var jade = require('jade');
var fs = require('fs');
var md = require('marked');
var less = require('less');
var _ = require('underscore');

if (process.argv.length != 4) {
  throw new Error('Expected two arguments.\n'
    + 'Usage: hyde <source directoy> <target directory>');
}

var sourceDir = path.join(process.cwd(), process.argv[2]);
var targetDir = path.join(process.cwd(), process.argv[3]);

//Load in global variables
var defaultConfig = {
  'main_template_file': 'main.jade',
  'vars': {}
};
var config = _.defaults(require(path.join(sourceDir, '.hyde.json')), defaultConfig);

//Jade compiler functions
var jadeFunctions = {};

var jadeOptions = {};

//Build main jade template
var mainTemplateFile = path.join(sourceDir, config['main_template_file']);
var defaultJadeFunction = jadeFunctions[mainTemplateFile] = jade.compileFile(mainTemplateFile, jadeOptions);

var copyFile = function (src, dest) {
  fs.createReadStream(src).pipe(fs.createWriteStream(dest));
};

var guaranteeDirectory = function (dir) {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
}

//Less options
var lessOptions = _.defaults(config.lessOptions);

//Build pages
// dirPath: String The directory relative to the sourceDir
var Directory = function (dirPath) {
  this.dirPath = dirPath;
};

Directory.prototype.getChildren = function (callback) {
  fs.readdir(this.getSourcePath(), callback);
};

Directory.prototype.getSourcePath = function () {
  return path.join(sourceDir, this.dirPath);
}

Directory.prototype.getTargetPath = function () {
  return path.join(targetDir, this.dirPath);
}

//compiles the given directory, including recursive directories
Directory.prototype.compile = function () {
  console.info('Compiling ' + this.dirPath);
  var thisObj = this;

  //guarantee target directory exists
  guaranteeDirectory(this.getTargetPath());

  this.getChildren(function (err, files) {
    if (err) throw (err);

    _.each(files, function (filename) {
      var sourceFilename = path.join(thisObj.getSourcePath(), filename);
      fs.lstat(sourceFilename, function (err, stats) {
        if (err) throw err;
        if (stats.isFile()) {
          var ext = _.last(filename.split('.')).toLowerCase();
          var base = filename.substr(0, filename.length - ext.length - 1);
          //if json, compile
          if (ext === 'json' && base !== '.hyde') {
            console.info('Parsing json ' + sourceFilename);
            var pageObj = _.defaults(require(path.join(thisObj.getSourcePath(), filename)), defaultConfig['vars']);
            var pageOutput;
            //compile corresponding markdown file
            fs.readFile(path.join(thisObj.getSourcePath(), base + '.md'), 'utf8', function (err, data) {
              if (err) throw err;

              pageObj['content'] = md(data);

              //generate html from jade
              if (pageObj.template) {
                var fullTemplatePath = path.join(thisObj.getSourcePath(), pageObj.template);
                if (!jadeFunctions[fullTemplatePath]) {
                  //need to compile jade file
                  jadeFunctions[fullTemplatePath] = jade.compileFile(fullTemplatePath, jadeOptions);
                }

                pageOutput = (jadeFunctions[fullTemplatePath])(pageObj);
              } else {
                //use default function
                pageOutput = defaultJadeFunction(pageObj);
              }

              var targetFilepath;

              if (base === 'index') {
                targetFilepath = path.join(thisObj.getTargetPath(), 'index.html');
              } else {
                //create containing directory
                guaranteeDirectory(path.join(thisObj.getTargetPath(), base));
                targetFilepath = path.join(thisObj.getTargetPath(), base, 'index.html');
              }

              //write output
              fs.writeFile(targetFilepath, pageOutput, function (err) {
                if (err) throw err;
              });

            });
          } else if (ext === 'md' || ext == 'jade') {
            //do nothing
            console.info('Skipping ' + sourceFilename);
          } else if (ext === 'less') {
            console.info('Compiling ' + sourceFilename);
            fs.readFile(path.join(sourceFilename), 'utf8', function (err, data) {
              if (err) throw err;
              //replace .less file in source with .css in target
              less.render(data, lessOptions).then(function (output) {
                fs.writeFile(path.join(thisObj.getTargetPath(), base + '.css'), output.css, function (err) {
                  if (err) throw err;
                });
              })
            });
          } else if (base !== '.hyde') {
            //otherwise, copy
            console.info('Copying ' + sourceFilename);
            copyFile(sourceFilename, path.join(thisObj.getTargetPath(), filename));
          }
        } else if (stats.isDirectory()) {
          //recurse
          (new Directory(thisObj.dirPath + '/' + filename)).compile();
        }
      });
    });
  });
};

(new Directory('.')).compile();
