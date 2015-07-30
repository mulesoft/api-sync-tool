'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
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
