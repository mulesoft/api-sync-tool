'use strict';

var _ = require('lodash');

module.exports = function (apiFileFactory, apiPlatformService, localService,
    logger, messages, workspaceRepository) {
  return {
    push: push
  };

  function push() {
    var workspace;

    return workspaceRepository.get()
      .then(function (currentWorkspace) {
        workspace = currentWorkspace;
        return localService.status();
      })
      .then(function (status) {
        return apiPlatformService.getAPIFilesMetadata(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id)
          .then(function (filesMetadata) {
            return {
              status: status,
              remoteFiles: filesMetadata
            };
          });
      })
      .then(function (output) {
        var status = output.status;
        var remoteFiles = output.remoteFiles;
        var result = {};

        return pushNewFiles(workspace, status.added, remoteFiles)
          .then(function (addedResult) {
            result.added = _.pluck(addedResult, 'path');
            return pushChangedFiles(workspace, status.changed, remoteFiles);
          })
          .then(function (changedResult) {
            result.changed = _.pluck(changedResult, 'path');
            return pushDeletedFiles(workspace, status.deleted, remoteFiles);
          })
          .then(function (deletedResult) {
            result.deleted = deletedResult;
            return result;
          });
      })
      .then(function (result) {
        return workspaceRepository.update(workspace)
          .then(function () {
            return result;
          });
      })
      .catch(function (err) {
        return workspaceRepository.update(workspace)
          .then(function () {
            return Promise.reject(err);
          });
      });
  }

  function pushNewFiles(workspace, addedFiles, remoteFiles) {
    if (!_.isEmpty(addedFiles)) {
      logger.info(messages.pushProgressNew());
    }
    return Promise.all(addedFiles.map(function (addedFilePath) {
      return apiFileFactory.create(workspace.bizGroup.id,
        workspace.api.id, workspace.apiVersion.id, addedFilePath, remoteFiles)
        .then(function (fileToAdd) {
          return apiPlatformService.createAPIFile(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, fileToAdd);
        })
        .then(function (addedFileResult) {
          workspace.files.push(addedFileResult);

          return addedFileResult;
        });
    }));
  }

  function pushChangedFiles(workspace, changedFiles, remoteFiles) {
    if (!_.isEmpty(changedFiles)) {
      logger.info(messages.pushProgressChanged());
    }
    return Promise.all(changedFiles.map(function (changedFile) {
      var changedFileObject = _.find(remoteFiles, 'path', changedFile);
      return apiPlatformService.updateAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, changedFileObject)
        .then(function (changedFileResult) {
          var changedFileMetadata = _.find(workspace.files, 'path',
            changedFileResult.path);
          changedFileMetadata.hash = changedFileResult.hash;

          return changedFileResult;
        });
    }));
  }

  function pushDeletedFiles(workspace, deletedFiles, remoteFiles) {
    if (!_.isEmpty(deletedFiles)) {
      logger.info(messages.pushProgressDeleted());
    }
    return Promise.all(deletedFiles.map(function (deletedFile) {
      var deletedFileObject = _.find(remoteFiles, 'path', deletedFile);
      return apiPlatformService.deleteAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, deletedFileObject)
        .then(function (deletedFileResult) {
          workspace.files = _.reject(workspace.files, 'path',
            deletedFileResult);

          return deletedFileResult;
        });
    }));
  }
};
