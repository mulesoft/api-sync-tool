'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformService, localService, logger, messages,
  workspaceRepository) {
  return {
    push: push
  };

  function push() {
    var workspace = workspaceRepository.get();

    return localService.status()
      .then(function (status) {
        return apiPlatformService.getAPIFilesMetadata(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id)
          .then(function (files) {
            return {
              status: status,
              files: files
            };
          });
      })
      .then(function (output) {
        var status = output.status;
        var files = output.files;
        var result = {};

        return pushNewFiles(workspace, status)
          .then(function (addedResult) {
            result.added = _.pluck(addedResult, 'path');
            return pushChangedFiles(workspace, status, files);
          })
          .then(function (changedResult) {
            result.changed = _.pluck(changedResult, 'path');
            return pushDeletedFiles(workspace, status, files);
          })
          .then(function (deletedResult) {
            result.deleted = deletedResult;
            return result;
          });
      })
      .then(function (result) {
        workspaceRepository.update(workspace);

        return result;
      })
      .catch(function (err) {
        workspaceRepository.update(workspace);

        return Promise.reject(err);
      });
  }

  function pushNewFiles(workspace, status) {
    if (!_.isEmpty(status.added)) {
      logger.info(messages.pushProgressNew());
    }
    return Promise.all(status.added.map(function (addedFile) {
      return apiPlatformService.createAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, addedFile)
        .then(function (addedFileResult) {
          workspace.files.push(addedFileResult);

          return addedFileResult;
        });
    }));
  }

  function pushChangedFiles(workspace, status, files) {
    if (!_.isEmpty(status.changed)) {
      logger.info(messages.pushProgressChanged());
    }
    return Promise.all(status.changed.map(function (changedFile) {
      var changedFileObject = _.find(files, 'path', changedFile);
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

  function pushDeletedFiles(workspace, status, files) {
    if (!_.isEmpty(status.deleted)) {
      logger.info(messages.pushProgressDeleted());
    }
    return Promise.all(status.deleted.map(function (deletedFile) {
      var deletedFileObject = _.find(files, 'path', deletedFile);
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
