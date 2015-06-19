'use strict';

module.exports = function (apiPlatformService, workspaceRepository, logger, messages) {
  return {
    getAPIFiles: getAPIFiles
  };

  function getAPIFiles() {
    logger.info(messages.downloadingAPI());
    var workspace = workspaceRepository.get();
    return apiPlatformService.getAPIFiles(workspace.bizGroup.id, workspace.api.id,
      workspace.apiVersion.id)
      .then(function (files) {
        workspace.files = files;
        workspaceRepository.update(workspace);
        logger.info(messages.APIdownloadFinished());
        return files;
      });
  }
};
