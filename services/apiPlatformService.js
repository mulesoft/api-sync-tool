'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformRepository, fileSystemRepository,
  contextHolder, decompresser) {
  return {
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles,
    getAPIFilesMetadata: getAPIFilesMetadata,
    createAPIFile: createAPIFile,
    updateAPIFile: updateAPIFile,
    deleteAPIFile: deleteAPIFile
  };

  function getAllAPIs(organizationId) {
    return apiPlatformRepository.getAllAPIs(organizationId);
  }

  // TODO this functions shouldn't know that the APIPlatform is returning
  // a compressed file. The logic of getting the API files should be in
  // the apiPlatformRepository
  function getAPIFiles(organizationId, apiId, apiVersionId) {
    return apiPlatformRepository.getAPIFilesMetadata(organizationId,
        apiId, apiVersionId)
      .then(function (filesMetadata) {
        if (_.isEmpty(filesMetadata)) {
          return Promise.resolve([]);
        } else {
          return getNotEmptyAPIFiles();
        }
      });

    function getNotEmptyAPIFiles() {
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
  }

  function getAPIFilesMetadata(organizationId, apiId, apiVersionId) {
    return apiPlatformRepository.getAPIFilesMetadata(organizationId, apiId,
        apiVersionId);
  }

  function createAPIFile(organizationId, apiId, apiVersionId, newFile) {
    return fileSystemRepository.getFile(newFile.path)
      .then(function (newFileData) {
        newFileData.parentId = newFile.parentId;
        return apiPlatformRepository.createAPIFile(organizationId, apiId,
            apiVersionId, newFileData);
      })
      .then(function (createdFile) {
        return getFileWithHash(createdFile.path);
      });
  }

  function updateAPIFile(organizationId, apiId, apiVersionId, updatedFile) {
    return fileSystemRepository.getFile(updatedFile.path)
      .then(function (updatedFileData) {
        updatedFile.data = updatedFileData.data.toString();
        return apiPlatformRepository.updateAPIFile(organizationId, apiId,
            apiVersionId, updatedFile);
      })
      .then(getFileWithHash);
  }

  function deleteAPIFile(organizationId, apiId, apiVersionId, deletedFile) {
    return apiPlatformRepository.deleteAPIFile(organizationId, apiId,
        apiVersionId, deletedFile);
  }

  function getFileWithHash(filePath) {
    return fileSystemRepository.getFileHash(filePath)
      .then(function (hash) {
        return {
          path: filePath,
          hash: hash
        };
      });
  }
};
