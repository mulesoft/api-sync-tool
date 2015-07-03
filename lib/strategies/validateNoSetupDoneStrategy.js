'use strict';

module.exports = function (workspaceRepository, errors) {
  return function validateNoSetupDoneStrategy() {
    return workspaceRepository.exists()
      .then(function (exists) {
        if (exists) {
          return workspaceRepository.get()
            .then(function (workspace) {
              return Promise.reject(new errors.SetupAlreadyDoneError(
                workspace.bizGroup.name,
                workspace.api.name,
                workspace.apiVersion.name));
            });
        }
      });
  };
};
