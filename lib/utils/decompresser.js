'use strict';

module.exports = function (BPromise, contextHolder, errors, fs, unzip) {
  return {
    decompressFile: decompressFile
  };

  function decompressFile(compressedFilePath) {
    return new BPromise(function (resolve, reject) {
      try {
        var reading = fs.createReadStream(compressedFilePath);
        var unzipping = reading.pipe(unzip.Extract({path: contextHolder.get().getDirectoryPath()}));

        reading.on('error', function (e) {
          reject(new errors.DecompressError(compressedFilePath, e));
        });
        unzipping.on('error', function (e) {
          reject(new errors.DecompressError(compressedFilePath, e));
        });
        unzipping.on('close', function () {
          resolve();
        });
      } catch (e) {
        return reject(new errors.DecompressError(compressedFilePath, e));
      }
    });
  }
};
