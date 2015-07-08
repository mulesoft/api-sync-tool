'use strict';

module.exports = function (localService) {
  return {
    status: status,
    conflicts: conflicts
  };

  function status() {
    return localService.status();
  }

  function conflicts() {
    return localService.conflicts();
  }
};
