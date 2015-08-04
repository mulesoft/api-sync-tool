'use strict';

var _ = require('lodash');

var compressedAPIFilePath = 'API.zip';

module.exports = function (apiPlatformRepository, BPromise,
    decompresser, fileSystemRepository, logger, messages) {
  return {
    createAPI: createAPI,
    createAPIVersion: createAPIVersion,
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles,
    getAPIFilesMetadata: getAPIFilesMetadata,
    createAPIDirectory: createAPIDirectory,
    deleteAPIDirectory: deleteAPIDirectory,
    createAPIFile: createAPIFile,
    updateAPIFile: updateAPIFile,
    deleteAPIFile: deleteAPIFile
  };

  function createAPI(organizationId, apiName, versionName, rootRamlPath) {
    var api;

    return apiPlatformRepository
      .createAPI(organizationId, apiName, versionName)
      .then(function (newApi) {
        logger.info(messages.apiCreated());
        api = newApi;
        return addRootRaml(
          api.organizationId,
          api.id,
          api.version.id,
          rootRamlPath
        );
      })
      .then(function (rootRamlFile) {
        api.rootRamlFile = rootRamlFile;
        return api;
      });
  }

  function createAPIVersion(organizationId, apiId, versionName, rootRamlPath) {
    var api;

    return apiPlatformRepository
      .createAPIVersion(organizationId, apiId, versionName)
      .then(function (newApi) {
        logger.info(messages.apiVersionCreated());
        api = newApi;
        return addRootRaml(
          organizationId,
          apiId,
          api.version.id,
          rootRamlPath
        );
      })
      .then(function (rootRamlFile) {
        api.rootRamlFile = rootRamlFile;
        return api;
      });
  }

  function getAllAPIs(organizationId) {
    return apiPlatformRepository.getAllAPIs(organizationId);
  }

  // TODO this functions shouldn't know that the APIPlatform is returning
  // a compressed file. The logic of getting the API files should be in
  // the apiPlatformRepository
  function getAPIFiles(organizationId, apiId, apiVersionId) {
    return apiPlatformRepository.getAPIFilesMetadata(organizationId,
        apiId, apiVersionId)
      .then(function (apiFilesMetadata) {
        if (_.isEmpty(apiFilesMetadata)) {
          return BPromise.resolve([]);
        } else {
          return getNotEmptyAPIFiles(apiFilesMetadata);
        }
      });

    function getNotEmptyAPIFiles(apiFilesMetadata) {
      var stream = fileSystemRepository.createWriteStream(
        getCompressedAPIFilePath());

      return apiPlatformRepository.getAPIFiles(organizationId, apiId,
          apiVersionId, stream)
        .then(decompressAPI)
        .then(removeCompressedAPI)
        .then(function () {
          return BPromise.props({
            files: getFilesWithHashes(
              _.filter(apiFilesMetadata, {isDirectory: false})),
            directories: _.chain(apiFilesMetadata)
              .filter({isDirectory: true})
              .map(function (apiFile) {
                return _.pick(apiFile, 'path', 'audit');
              })
              .value()
          });
        });

      function decompressAPI() {
        return decompresser.decompressFile(
          fileSystemRepository.getFileFullPath(getCompressedAPIFilePath()));
      }

      function removeCompressedAPI() {
        return fileSystemRepository.removeFile(getCompressedAPIFilePath());
      }

      function getFilesWithHashes(files) {
        return BPromise.all(files.map(function (file) {
          return getFileWithHash(file);
        }));
      }
    }
  }

  function getAPIFilesMetadata(organizationId, apiId, apiVersionId) {
    return apiPlatformRepository.getAPIFilesMetadata(organizationId, apiId,
        apiVersionId);
  }

  function createAPIDirectory(organizationId, apiId, apiVersionId, newDir) {
    return apiPlatformRepository
      .createAPIDirectory(organizationId, apiId, apiVersionId, newDir);
  }

  function deleteAPIDirectory(organizationId, apiId, apiVersionId, deletedDir) {
    return apiPlatformRepository.deleteAPIDirectory(organizationId, apiId,
      apiVersionId, deletedDir);
  }

  function createAPIFile(organizationId, apiId, apiVersionId, newFile) {
    return fileSystemRepository.getFile(newFile.path)
      .then(function (newFileData) {
        newFileData.parentId = newFile.parentId;
        return apiPlatformRepository.createAPIFile(organizationId, apiId,
            apiVersionId, newFileData);
      })
      .then(getFileWithHash);
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

  function getFileWithHash(file) {
    return fileSystemRepository.getFileHash(file.path)
      .then(function (hash) {
        file.hash = hash;
        return _.pick(file, ['audit', 'path', 'hash']);
      });
  }

  function getCompressedAPIFilePath() {
    return compressedAPIFilePath;
  }

  function addRootRaml(organizationId, apiId, apiVersionId, rootRamlPath) {
    logger.info(messages.uploadingRootRaml());
    return fileSystemRepository.getFile(rootRamlPath)
      .then(function (rootRaml) {
        return apiPlatformRepository.addRootRaml(
          organizationId,
          apiId,
          apiVersionId,
          rootRaml
        );
      })
      .tap(function () {
        logger.info(messages.rootRamlUploaded(rootRamlPath));
      });
  }
};
