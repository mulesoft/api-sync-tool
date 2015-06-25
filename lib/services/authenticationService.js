'use strict';

module.exports = function (csRepository) {
  return {
    login: login
  };

  function login(username, password) {
    return csRepository.login(username, password);
  }
};
