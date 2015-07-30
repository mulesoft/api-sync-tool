'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * Login error.
   *
   * @param {String} username
   */
  var LoginError = function (username) {
    this.message = messages.loginError(username);
    BaseError.call(this, this.message);
  };

  util.inherits(LoginError, BaseError);

  return LoginError;
};
