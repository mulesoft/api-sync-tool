'use strict';

module.exports = function (apiPlatformRepository, fileSystemRepository,
  contextHolder, decompresser) {
  return {
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles
  };

  function getAllAPIs() {
    return apiPlatformRepository.getAllAPIs();
  }
  // TODO this functions shouldn't know that the APIPlatform is returning
  // a compressed file. The logic of getting the API files should be in
  // the apiPlatformRepository
  function getAPIFiles(organizationId, apiId, apiVersionId) {
    var compressedAPIFilePath = 'API.zip';
    var stream = fileSystemRepository.createWriteStream(compressedAPIFilePath);

    return apiPlatformRepository.getAPIFiles(organizationId, apiId,
      apiVersionId, stream)
      .then(decompressAPI)
      .then(removeCompressedAPI)
      .then(fileSystemRepository.getFilesPath)
      .then(getFilesHashes);

    function decompressAPI() {
      return decompresser.decompressFile(contextHolder.get().getDirectoryPath(),
        fileSystemRepository.getFileFullPath(compressedAPIFilePath));
    }

    function removeCompressedAPI() {
      return fileSystemRepository.removeFile(compressedAPIFilePath);
    }

    function getFilesHashes(filePaths) {
      return Promise.all(filePaths.map(function (filePath) {
        return new Promise(function (resolve) {
          fileSystemRepository.getFileHash(filePath)
            .then(function (hash) {
              resolve({
                path: filePath,
                hash: hash
              });
            });
        });
      }));
    }
  }
};
