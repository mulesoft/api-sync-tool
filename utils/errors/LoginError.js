'use strict';

var util = require('util');

var BaseError = require('./BaseError');

/**
 * Login error.
 *
 * @param {String} username
 */
var LoginError = module.exports = function LoginError(username) {
  this.message = LoginError.prototype.humanMessage.replace('%user%', username);

  BaseError.call(this, this.message);
};

util.inherits(LoginError, BaseError);
LoginError.prototype.humanMessage = 'Login failed for user %user%';
