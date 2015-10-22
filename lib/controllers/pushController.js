'use strict';

var _ = require('lodash');
var path = require('path');
path.parse = path.parse || require('path-parse');

module.exports = function (apiPlatformService, BPromise,
    errors, forcePushCleanupStrategy, localService, logger, messages,
    updateFileStrategy, workspaceRepository) {
  return {
    forcePush: forcePush,
    push: push
  };

  function forcePush() {
    return localService.getConflicts()
      .then(checkRootRamlIsNotDeleted)
      .then(forcePushCleanupStrategy.cleanup)
      .then(push);

    function checkRootRamlIsNotDeleted(conflicts) {
      if (conflicts.rootRamlDeleted) {
        return BPromise.reject(
          new errors.RootRamlDeletedError(conflicts.rootRamlDeleted));
      }
    }
  }

  function push() {
    var workspace;
    var status;
    var conflicts;
    var remoteFiles;

    return BPromise.props({
      currentWorkspace: workspaceRepository.get(),
      localStatus: localService.getStatus(),
      conflicts: localService.getConflicts()
    })
    .tap(function (appState) {
      workspace = appState.currentWorkspace;
      conflicts = appState.conflicts;
      status = appState.localStatus;
    })
    .then(checkConflicts)
    .then(getAPIFilesMetadata)
    .tap(function (filesMetadata) {
      remoteFiles = filesMetadata;
    })
    .then(addDirectories)
    .then(pushNewFiles)
    .then(pushChangedFiles)
    .then(pushDeletedFiles)
    .then(pushDeletedDirectories)
    .then(function () {
      return _.pick(status,
        'addedDirectories',
        'added',
        'changed',
        'deleted',
        'deletedDirectories');
    })
    .finally(function () {
      if (workspace) {
        return workspaceRepository.update(workspace);
      }
    });

    function getAPIFilesMetadata() {
      return apiPlatformService.getAPIFilesMetadata(workspace.bizGroup.id,
        workspace.api.id, workspace.apiVersion.id);
    }

    function checkConflicts() {
      if (!_.isEmpty(_.flatten(_.values(conflicts)))) {
        return BPromise.reject(new errors.ConflictsFoundError(conflicts));
      }
    }

    function addDirectories() {
      var newDirectoriesPath = status.addedDirectories;
      newDirectoriesPath.sort();
      if (!_.isEmpty(newDirectoriesPath)) {
        logger.info(messages.newDirectoriesEmpty());
      }

      return BPromise.each(newDirectoriesPath,
        createAPIDirectory);

      function createAPIDirectory(newDirectoryPath) {
        var newDir = makeResource(newDirectoryPath,
          getRemoteDirectories());

        logger.info(messages.creatingDirectory(newDirectoryPath));
        return apiPlatformService.createAPIDirectory(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, newDir)
          .tap(function (newRemoteDirectory) {
            workspace.directories.push(newRemoteDirectory);
            newRemoteDirectory.isDirectory = true;
            remoteFiles.push(newRemoteDirectory);
          });
      }

      function getRemoteDirectories() {
        return _.filter(remoteFiles, 'isDirectory');
      }
    }

    function pushNewFiles() {
      var addedFiles = status.added;
      if (!_.isEmpty(addedFiles)) {
        logger.info(messages.pushProgressNew());
      }
      return BPromise.each(addedFiles, function (addedFilePath) {
        var newFile = makeResource(addedFilePath, remoteFiles);
        logger.info(messages.uploadingFile(addedFilePath));
        return apiPlatformService.createAPIFile(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, newFile)
          .tap(function (addedFileResult) {
            workspace.files.push(addedFileResult);
          });
      });
    }

    function pushChangedFiles() {
      var changedFiles = status.changed;
      if (!_.isEmpty(changedFiles)) {
        logger.info(messages.pushProgressChanged());
      }

      return BPromise.each(changedFiles, function (changedFile) {
        return updateFileStrategy.update(changedFile, remoteFiles, workspace);
      });
    }

    function pushDeletedFiles() {
      var deletedFiles = status.deleted;
      if (!_.isEmpty(deletedFiles)) {
        logger.info(messages.pushProgressDeleted());
      }

      return BPromise.each(deletedFiles, function (deletedFile) {
        var deletedFileObject = _.find(remoteFiles, 'path', deletedFile);
        logger.info(messages.deletingFile(deletedFile));
        return apiPlatformService.deleteAPIFile(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, deletedFileObject)
          .tap(function (deletedFileResult) {
            workspace.files = _.reject(workspace.files, 'path',
              deletedFileResult);
          });
      });
    }

    function pushDeletedDirectories() {
      var deletedDirectories = status.deletedDirectories;
      deletedDirectories.sort().reverse();
      return BPromise.each(deletedDirectories, function (deletedDirectory) {
        var deletedDirectoryObject = _.find(remoteFiles, 'path',
          deletedDirectory);
        return apiPlatformService.deleteAPIDirectory(workspace.bizGroup.id,
            workspace.api.id, workspace.apiVersion.id, deletedDirectoryObject)
          .tap(function (deletedDirectoryResult) {
            workspace.directories = _.reject(workspace.directories, 'path',
              deletedDirectoryResult);
          });
      });
    }
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
};
