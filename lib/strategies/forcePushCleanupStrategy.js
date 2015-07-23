'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformService, BPromise, logger, localService,
    messages, updateFileStrategy, workspaceRepository) {
  return {
    cleanup: cleanup
  };

  function cleanup() {
    var remoteDirectories;
    var remoteFiles;
    var workspace;
    var rootRamlFile;
    var rootRamlFileId;

    return workspaceRepository.get()
      .then(function (currentWorkspace) {
        workspace = currentWorkspace;
        return apiPlatformService.getAllAPIs(workspace.bizGroup.id);
      })
      .tap(getRootRamlFileId)
      .then(function () {
        return apiPlatformService.getAPIFilesMetadata(workspace.bizGroup.id,
          workspace.api.id,
          workspace.apiVersion.id);
      })
      .tap(function (apiFilesMetadata) {
        remoteDirectories = _.filter(apiFilesMetadata, 'isDirectory');
        remoteFiles = _.reject(apiFilesMetadata, 'isDirectory');
        rootRamlFile = _.find(remoteFiles, 'id', rootRamlFileId);
      })
      .then(deleteFiles)
      .then(deleteDirectories)
      .then(pushConflictiveRootRaml)
      .then(updateWorkspace);

    function getRootRamlFileId(apis) {
      rootRamlFileId = _.chain(apis)
        .find('id', workspace.api.id)
        .get('versions')
        .find('id', workspace.apiVersion.id)
        .value()
        .rootFileId;
    }

    function deleteFiles() {
      var remoteFilesWithouRootRaml = _.reject(remoteFiles, 'id', rootRamlFileId);
      logger.info(messages.deletingAllFilesMessage());
      return BPromise.each(remoteFilesWithouRootRaml, function (remoteFile) {
        logger.info(messages.deletingFile(remoteFile.path));
        return apiPlatformService.deleteAPIFile(
          workspace.bizGroup.id,
          workspace.api.id,
          workspace.apiVersion.id,
          remoteFile);
      });
    }

    function deleteDirectories() {
      remoteDirectories = _.sortBy(remoteDirectories, 'path').reverse();
      logger.info(messages.deletingAllDirectoriesMessage());
      return BPromise.each(remoteDirectories, function (remoteDirectory) {
        logger.info(messages.deletingDirectory(remoteDirectory.path));
        return apiPlatformService.deleteAPIDirectory(
          workspace.bizGroup.id,
          workspace.api.id,
          workspace.apiVersion.id,
          remoteDirectory);
      });
    }

    function updateWorkspace() {
      workspace.files = _.filter(workspace.files, 'path', rootRamlFile.path);
      workspace.directories = [];
      return workspaceRepository.update(workspace);
    }

    function pushConflictiveRootRaml() {
      logger.info(messages.uploadingRootRaml());

      return updateFileStrategy.update(
        rootRamlFile.path,
        remoteFiles,
        workspace);
    }
  }
};
