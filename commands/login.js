'use strict';

var loginService = require('../services/loginService');
var fsRepository = require('../repositories/configurationRepository');

module.exports = {
  execute: function (user) {
    var configuration = fsRepository.getCurrentConfig();

    return loginService.login(user.name, user.password)
      .then(function (authentication) {
        configuration.authentication = authentication;

        fsRepository.updateCurrentConfiguration(configuration);
      });
  }
};
