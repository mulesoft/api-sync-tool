'use strict';

var _ = require('lodash');
var BPromise = require('bluebird');
var path = require('path');

module.exports = function (apiPlatformService, localService, logger,
    messages, workspaceRepository) {
  return {
    push: push
  };

  function push() {
    var workspace;
    var status;
    var remoteFiles;
    return workspaceRepository.get()
      .then(function (currentWorkspace) {
        workspace = currentWorkspace;
        return localService.status();
      })
      .then(function (localStatus) {
        status = localStatus;
        status.addedDirectories = [];
        return apiPlatformService.getAPIFilesMetadata(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id);
      })
      .then(function (filesMetadata) {
        remoteFiles = filesMetadata;
        return localService.getDirectoriesPath();
      })
      .then(function (directories) {
        return BPromise.each(getNewDirectoriesPath(directories),
          createAPIDirectory);

        function createAPIDirectory(newDirectoryPath) {
          var newDir = makeResource(newDirectoryPath,
            getRemoteDirectories());

          return apiPlatformService.createAPIDirectory(workspace.bizGroup.id,
              workspace.api.id, workspace.apiVersion.id, newDir)
            .then(function (newRemoteDirectory) {
              newRemoteDirectory.isDirectory = true;
              remoteFiles.push(newRemoteDirectory);
              status.addedDirectories.push(newRemoteDirectory.path);
            });
        }

        function getNewDirectoriesPath(directories) {
          var remoteDirectoriesPath = _.pluck(getRemoteDirectories(), 'path');
          return _.reject(directories,
            function (directory) {
              return _.includes(remoteDirectoriesPath, directory);
            })
            .sort();
        }

        function getRemoteDirectories() {
          return _.filter(remoteFiles, 'isDirectory');
        }
      })
      .then(function () {
        var result = _.pick(status, 'addedDirectories');

        return pushNewFiles(workspace, status.added, remoteFiles)
          .then(function () {
            result.added = status.added;
            return pushChangedFiles(workspace, status.changed, remoteFiles);
          })
          .then(function () {
            result.changed = status.changed;
            return pushDeletedFiles(workspace, status.deleted, remoteFiles);
          })
          .then(function () {
            result.deleted = status.deleted;
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

  function makeResource(resourcePath, remoteFiles) {
    return {
      path: resourcePath,
      parentId: isRoot(resourcePath) ?
        null : getDirectoryId(path.dirname(resourcePath))
    };

    function isRoot(resourcePath) {
      return path.parse(resourcePath).root ===
        path.parse(resourcePath).dir;
    }

    function getDirectoryId(directoryPath) {
      return _.find(remoteFiles, 'path', directoryPath).id;
    }
  }

  function pushNewFiles(workspace, addedFiles, remoteFiles) {
    if (!_.isEmpty(addedFiles)) {
      logger.info(messages.pushProgressNew());
    }
    return BPromise.each(addedFiles, function (addedFilePath) {
      var newFile = makeResource(addedFilePath, remoteFiles);
      return apiPlatformService.createAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, newFile)
        .then(function (addedFileResult) {
          workspace.files.push(addedFileResult);

          return addedFileResult;
        });
    });
  }

  function pushChangedFiles(workspace, changedFiles, remoteFiles) {
    if (!_.isEmpty(changedFiles)) {
      logger.info(messages.pushProgressChanged());
    }

    return BPromise.each(changedFiles, function (changedFile) {
      var changedFileObject = _.find(remoteFiles, 'path', changedFile);
      return apiPlatformService.updateAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, changedFileObject)
        .then(function (changedFileResult) {
          var changedFileMetadata = _.find(workspace.files, 'path',
            changedFileResult.path);
          changedFileMetadata.hash = changedFileResult.hash;

          return changedFileResult;
        });
    });
  }

  function pushDeletedFiles(workspace, deletedFiles, remoteFiles) {
    if (!_.isEmpty(deletedFiles)) {
      logger.info(messages.pushProgressDeleted());
    }

    return BPromise.each(deletedFiles, function (deletedFile) {
      var deletedFileObject = _.find(remoteFiles, 'path', deletedFile);
      return apiPlatformService.deleteAPIFile(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id, deletedFileObject)
        .then(function (deletedFileResult) {
          workspace.files = _.reject(workspace.files, 'path',
            deletedFileResult);

          return deletedFileResult;
        });
    });
  }
};
