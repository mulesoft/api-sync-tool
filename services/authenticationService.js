'use strict';

// TODO: Add logic to select appropriate repository.
module.exports = function (csRepository) {
  return {
    login: function (username, password) {
      return csRepository.login(username, password);
    }
  };
};
