'use strict';

module.exports = function (authenticationRepository, workspaceRepository) {
  return {
    cleanup: cleanup
  };

  function cleanup() {
    return Promise.all([
      workspaceRepository.del(),
      authenticationRepository.del()
    ]);
  }
};
