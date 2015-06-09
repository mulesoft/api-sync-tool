'use strict';

var AdmZip = require('adm-zip');

module.exports = function () {
  return {
    decompressFile: decompressFile
  };

  function decompressFile(extractDirectoryPath, compressedFilePath) {
    var zip = new AdmZip(compressedFilePath);
    return new Promise(function (resolve, reject) {
      zip.extractAllToAsync(extractDirectoryPath, true, function (err) {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }
};
