'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * BadCredentialsError error.
   */
  var BadCredentialsError = function () {
    this.message = messages.badCredentialsError();
    BaseError.call(this, this.message);
  };

  util.inherits(BadCredentialsError, BaseError);

  return BadCredentialsError;
};
