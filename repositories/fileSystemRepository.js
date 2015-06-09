'use strict';

var fs = require('fs');
var path = require('path');
var sha = require('sha');

module.exports = function (contextHolder) {
  return {
    getFileFullPath: getFileFullPath,
    getFileHash: getFileHash,
    getFilesPath: getFilesPath,
    createWriteStream: createWriteStream,
    removeFile: removeFile
  };

  function getFileFullPath(fileLocalPath) {
    return path.join(contextHolder.get().getDirectoryPath(), fileLocalPath);
  }

  function getFileHash(localFilePath) {
    return new Promise(function (resolve, reject) {
      sha.get(getFileFullPath(localFilePath), function (err, hash) {
        if (err) {
          reject(err);
        }

        resolve(hash);
      });
    });
  }

  function getFilesPath(directory) {
    return new Promise(function (resolve) {
      var result = [];
      readDir(getFileFullPath(directory || '/'), '', result);

      return resolve(result);
    });
  }

  function createWriteStream(localFilePath) {
    return fs.createWriteStream(getFileFullPath(localFilePath));
  }

  function removeFile(fileLocalPath) {
    return new Promise(function (resolve, reject) {
      fs.unlink(getFileFullPath(fileLocalPath), function (err) {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  }

  // TODO: Make it async
  function readDir(directory, parent, result) {
    var files = fs.readdirSync(directory);

    files.forEach(function (file) {
      var filePath = parent ? path.join(directory, file) : file;
      var stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        readDir(parent ? path.join(directory, file) : file, directory, result);
      } else {
        result.push('/' + filePath);
      }
    });
  }
};
