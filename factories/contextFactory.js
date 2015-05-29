'use strict';

var _ = require('lodash');

module.exports = function (configurationRepository) {
  return {
    create: function () {
      var config = configurationRepository.getCurrentConfig();

      return {
        getToken: function () {
          return config && config.authentication && config.authentication.access_token;
        }
      };
    }
  };
};
