'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sha = require('sha');

module.exports = function () {
  return {
    writeFile: function (data, fileName) {
      var filePath = path.join(process.cwd(), fileName);
      fs.writeFileSync(filePath, data);

      return Promise.resolve(sha.getSync(filePath));
    },
    makeDirectory: function (directoryPath) {
      return new Promise(function (resolve, reject) {
        fs.mkdir(path.join(process.cwd(), directoryPath), resolve);
      });
    },
    getFiles: function (directory) {
      return new Promise(function (resolve, reject) {
        var result = [];
        readDir(directory, '', result);

        return resolve(result);
      });
    },
    readFile: function (filePath) {
      return {
        name: filePath.substring(filePath.lastIndexOf(path.sep)),
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
