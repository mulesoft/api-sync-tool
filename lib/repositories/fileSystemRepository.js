'use strict';

var path = require('path');
var _ = require('lodash');

module.exports = function (contextHolder, fs, promisify, sha) {
  return {
    getFile: getFile,
    getFileFullPath: getFileFullPath,
    getFileHash: getFileHash,
    getFilesPath: getFilesPath,
    createWriteStream: createWriteStream,
    removeFile: removeFile
  };

  function getFile(filePath) {
    return promisify(fs.readFile)(getFileFullPath(filePath))
      .then(function (data) {
        return {
          path: filePath,
          data: data
        };
      });
  }

  function getFileFullPath(fileLocalPath) {
    return path.join(contextHolder.get().getDirectoryPath(), fileLocalPath);
  }

  function getFileHash(localFilePath) {
    return sha.get(getFileFullPath(localFilePath));
  }

  /**
   * Returns the relative paths of all files descending from a directory
   * in the local repository. If no directory is provided it uses the root
   * of the local repository.
   *
   * @param {String} directory The directory whom all
   * descendants will be returned
   */
  function getFilesPath(directory) {
    return getDirectoryFilesPath(directory || '');
  }

  function createWriteStream(localFilePath) {
    return fs.createWriteStream(getFileFullPath(localFilePath));
  }

  function removeFile(fileLocalPath) {
    return promisify(fs.unlink)(getFileFullPath(fileLocalPath));
  }

  /**
   * Returns the relative paths of all files descending from a directory
   * in the local repository
   *
   * @param {String} directory The directory whom all
   * descendants will be returned
   */
  function getDirectoryFilesPath(directory) {
    return promisify(fs.readdir)(getFileFullPath(directory))
      .then(function (filePaths) {
        return filePaths.map(function (filePath) {
          var fullLocalFilePath = directory + '/' + filePath;
          return promisify(fs.stat)(getFileFullPath(fullLocalFilePath))
            .then(function (stats) {
              if (stats.isDirectory()) {
                return getDirectoryFilesPath(fullLocalFilePath);
              } else {
                return Promise.resolve(fullLocalFilePath);
              }
            });
        });
      })
      // TODO We should use then(Promise.all) but it doesn't work properly
      // look for the reason and inform the rest of the team
      .then(function (promises) {
        return Promise.all(promises);
      })
      .then(_.flatten);
  }
};
