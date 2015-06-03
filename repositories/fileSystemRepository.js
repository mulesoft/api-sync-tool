'use strict';

var fs = require('fs');
var path = require('path');
var sha = require('sha');

module.exports = function () {
  return {
    writeFile: function (file) {
      fs.writeFileSync(path.join(process.cwd(), file.name), file.data);
      file.hash = sha.getSync(file.name);

      return file;
    },
    getFiles: function (directory) {
      return new Promise(function (resolve) {
        var result = [];
        readDir(directory, '', result);

        return resolve(result);
      });
    },
    readFile: function (filePath) {
      return {
        name: filePath.substring(filePath.lastIndexOf(path.delimited)),
        hash: sha.getSync(filePath),
        path: '/' + filePath
      };
    }
  };
};

function readDir(directory, parent, result) {
  var files = fs.readdirSync(directory);

  files.forEach(function (file) {
    var filePath = parent ? path.join(directory, file) : file;
    var stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      readDir(parent ? path.join(directory, file) : file, directory, result);
    } else {
      result.push(filePath);
    }
  });
}
