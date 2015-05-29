'use strict';

// TODO: Add logic to select appropriate service.
var csService = require('./csService');

module.exports = {
  login: function (username, password) {
    return csService.login(username, password);
  }
};
