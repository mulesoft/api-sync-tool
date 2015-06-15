'use strict';

var AdmZip = require('adm-zip');
var promisify = require('promisify-node');

module.exports = function () {
  return {
    decompressFile: decompressFile
  };

  function decompressFile(extractDirectoryPath, compressedFilePath) {
    var zip = new AdmZip(compressedFilePath);
    return promisify(zip.extractAllToAsync)(extractDirectoryPath, true);
  }
};
