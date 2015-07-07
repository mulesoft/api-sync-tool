'use strict';

var AdmZip = require('adm-zip');
var BPromise = require('bluebird');

module.exports = function (errors) {
  return {
    decompressFile: decompressFile
  };

  function decompressFile(extractDirectoryPath, compressedFilePath) {
    var zip;
    try {
      zip = new AdmZip(compressedFilePath);
    } catch (e) {
      return BPromise.reject(new errors.DecompressError(compressedFilePath, e));
    }

    return BPromise.promisify(zip.extractAllToAsync)(extractDirectoryPath, true)
      .catch(function (e) {
        return BPromise.reject(
          new errors.DecompressError(compressedFilePath, e));
      });
  }
};
