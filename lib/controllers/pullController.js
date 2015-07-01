'use strict';

module.exports = function (apiPlatformService, logger, messages,
    workspaceRepository) {
  return {
    getAPIFiles: getAPIFiles
  };

  function getAPIFiles() {
    var workspace;

    logger.info(messages.downloadingAPI());

    return workspaceRepository.get()
      .then(function (currentWorkspace) {
        workspace = currentWorkspace;
        return apiPlatformService.getAPIFiles(workspace.bizGroup.id,
          workspace.api.id, workspace.apiVersion.id);
      })
      .then(function (result) {
        workspace.files = result.files;
        workspace.directories = result.directories;
        return workspaceRepository.update(workspace);
      })
      .then(function () {
        logger.info(messages.finishedDownloadingAPI());
        return {
          files: workspace.files,
          directories: workspace.directories
        };
      });
  }
};
