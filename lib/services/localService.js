'use strict';

var _ = require('lodash');

// TODO: Add logic to select appropriate repository.
module.exports = function (apiPlatformRepository, BPromise,
    fileSystemRepository, workspaceRepository) {
  return {
    getFilesPath: getFilesPath,
    getStatus: getStatus,
    getConflicts: getConflicts,
    isRootRamlDeleted: isRootRamlDeleted
  };

  function getFilesPath() {
    return fileSystemRepository.getFilesPath();
  }

  function getStatus() {
    var result = {
      addedDirectories: [],
      deletedDirectories: [],
      added: [],
      deleted: [],
      changed: [],
      unchanged: []
    };

    return BPromise.props({
        filesPath: fileSystemRepository.getFilesPath(),
        directoriesPath: fileSystemRepository.getDirectoriesPath(),
        workspace: workspaceRepository.get()
      })
      .then(function (currentState) {
        var localFilePaths = currentState.filesPath;
        var storedFiles = currentState.workspace.files;
        var localDirectoriesPath = currentState.directoriesPath;
        var storedDirectories = currentState.workspace.directories;

        return getFileStatus()
          .then(getDirectoriesStatus)
          .return(result);

        function getFileStatus() {
          return BPromise.all(localFilePaths.map(function (localFilePath) {
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
          });
        }

        function getDirectoriesStatus() {
          localDirectoriesPath.forEach(function (localDirectoryPath) {
            var existingDirectory = _.find(storedDirectories, 'path',
              localDirectoryPath);
            if (existingDirectory) {
              storedDirectories = _.reject(storedDirectories, 'path',
              localDirectoryPath);
            } else {
              result.addedDirectories.push(localDirectoryPath);
            }
          });

          result.deletedDirectories = _.pluck(storedDirectories, 'path');
        }
    });
  }

  function getConflicts() {
    var localStatus;
    var workspace;

    var result = {
      addedAlreadyExists: [],
      changedWasDeleted: [],
      changedRemotely: [],
      deletedRemotely: [],
      deletedNotExists: []
    };

    return BPromise.props({
        status: getStatus(),
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

          // If file exists remotely, there is a conflict.
          if (remoteFile) {
            result.addedAlreadyExists.push(addedFile);
          }
        });

        localStatus.changed.forEach(function (changedFile) {
          var localFile = _.find(workspace.files, 'path', changedFile);
          var remoteFile = _.find(remoteFiles, 'path', changedFile);

          // If file does not exist remotely, there is a conflict.
          if (!remoteFile) {
            return result.changedWasDeleted.push(changedFile);
          }

          // If file was changed remotely, there is a conflict.
          if (lastUpdated(localFile) !== lastUpdated(remoteFile)) {
            result.changedRemotely.push(changedFile);
          }

          function lastUpdated(file) {
            if (file.audit) {
              return file.audit.updated.date ?
                file.audit.updated.date :
                file.audit.created.date;
            }
          }
        });

        localStatus.unchanged.forEach(function (unchangedFile) {
          var remoteFile = _.find(remoteFiles, 'path', unchangedFile);

          // If file does not exist remotely, there is a conflict.
          if (!remoteFile) {
            result.deletedRemotely.push(unchangedFile);
          }
        });

        localStatus.deleted.forEach(function (deletedFile) {
          var remoteFile = _.find(remoteFiles, 'path', deletedFile);

          // If file does not exist remotely, there is a conflict.
          if (!remoteFile) {
            result.deletedNotExists.push(deletedFile);
          }
        });

        if (isRootRamlDeleted(workspace, localStatus.deleted)) {
          result.rootRamlDeleted = workspace.rootRamlPath;
        }

        return result;
      });
  }

  function isRootRamlDeleted(workspace, deletedFilesPath) {
    return _.includes(deletedFilesPath, workspace.rootRamlPath);
  }
};
