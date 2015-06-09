'use strict';

module.exports = function (apiPlatformService, workspaceRepository) {
  return {
    getAPIFiles: getAPIFiles
  };

  function getAPIFiles() {
    var workspace = workspaceRepository.get();
    return apiPlatformService.getAPIFiles(workspace.subOrg.id, workspace.api.id,
      workspace.apiVersion.id)
      .then(function (files) {
        workspace.files = files;
        workspaceRepository.update(workspace);

        return files;
      });
  }
};
