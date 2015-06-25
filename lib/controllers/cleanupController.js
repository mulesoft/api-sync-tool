'use strict';

module.exports = function (authenticationRepository, workspaceRepository) {
  return {
    cleanup: cleanup
  };

  function cleanup() {
    workspaceRepository.del();
    authenticationRepository.del();

    return Promise.resolve();
  }
};
