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
      .then(function (files) {
        workspace.files = files;
        return workspaceRepository.update(workspace);
      })
      .then(function () {
        logger.info(messages.finishedDownloadingAPI());
        return workspace.files;
      });
  }
};
