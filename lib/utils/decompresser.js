'use strict';

var AdmZip = require('adm-zip');
var promisify = require('promisify-node');

module.exports = function (errors) {
  return {
    decompressFile: decompressFile
  };

  function decompressFile(extractDirectoryPath, compressedFilePath) {
    var zip;
    try {
      zip = new AdmZip(compressedFilePath);
    } catch (e) {
      return Promise.reject(new errors.DecompressError(compressedFilePath, e));
    }

    return promisify(zip.extractAllToAsync)(extractDirectoryPath, true)
      .catch(function (e) {
        return Promise.reject(
          new errors.DecompressError(compressedFilePath, e));
      });
  }
};
