'use strict';

module.exports = function (BPromise, errors, workspaceRepository) {
  return function validateNoSetupDoneStrategy() {
    return workspaceRepository.exists()
      .then(function (exists) {
        if (exists) {
          return workspaceRepository.get()
            .then(function (workspace) {
              return BPromise.reject(new errors.SetupAlreadyDoneError(
                workspace.bizGroup.name,
                workspace.api.name,
                workspace.apiVersion.name));
            });
        }
      });
  };
};
