'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');

// TODO: Add logic to select appropriate repository.
module.exports = function (apiPlatformRepository, fileSystemRepository,
    workspaceRepository) {
  return {
    getDirectoriesPath: getDirectoriesPath,
    status: status,
    conflicts: conflicts
  };

  function getDirectoriesPath() {
    return fileSystemRepository.getDirectoriesPath();
  }

  function status() {
    var result = {
      added: [],
      deleted: [],
      changed: [],
      unchanged: []
    };

    return BPromise.props({
        filesPath: fileSystemRepository.getFilesPath(),
        workspace: workspaceRepository.get()
      })
      .then(function (currentState) {
        var localFilePaths = currentState.filesPath;
        var storedFiles = currentState.workspace.files;

        return Promise.all(localFilePaths.map(function (localFilePath) {
          // Search file in storedFiles.
          var existingFile = _.find(storedFiles, 'path', localFilePath);

          // File exists
          if (existingFile) {
            // Remove file from stored list if it exists.
            storedFiles = _.reject(storedFiles, 'path', localFilePath);

            // If content has changed
            return fileSystemRepository.getFileHash(localFilePath)
              .then(function (hash) {
                if (existingFile.hash !== hash) {
                  result.changed.push(existingFile.path);
                } else {
                  result.unchanged.push(existingFile.path);
                }
              });
          } else {
            result.added.push(localFilePath);
          }
        })).then(function () {
          result.deleted = _.pluck(storedFiles, 'path');
          return result;
        });
    });
  }

  function conflicts() {
    var localStatus;
    var workspace;

    var result = {
      addedAlreadyExists: [],
      changedWasDeleted: [],
      changedRemotely: [],
      deletedNotExists: []
    };

    return BPromise.props({
        status: status(),
        workspace: workspaceRepository.get()
      })
      .then(function (currentState) {
        localStatus = currentState.status;
        workspace = currentState.workspace;

        return apiPlatformRepository.getAPIFilesMetadata(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id);
      }).then(function (remoteFiles) {
        localStatus.added.forEach(function (addedFile) {
          var remoteFile = _.find(remoteFiles, 'path', addedFile);
          if (remoteFile) {
            result.addedAlreadyExists.push(addedFile);
          }
        });

        localStatus.changed.forEach(function (changedFile) {
          var localFile = _.find(workspace.files, 'path', changedFile);
          var remoteFile = _.find(remoteFiles, 'path', changedFile);

          var localFileLastUpdated =
            localFile.audit && localFile.audit.updated ?
            localFile.audit.updated.date :
            undefined;

          if (!remoteFile) {
            result.changedWasDeleted.push(changedFile);
          } else if (localFileLastUpdated !== remoteFile.audit.updated.date) {
            result.changedRemotely.push(changedFile);
          }
        });

        localStatus.deleted.forEach(function (deletedFile) {
          var remoteFile = _.find(remoteFiles, 'path', deletedFile);
          if (!remoteFile) {
            result.deletedNotExists.push(deletedFile);
          }
        });

        return result;
      });
  }
};
