'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The client was call with no parameters at all
   */
  var NoParametersError = function () {
    this.message = messages.generalUsage();
    BaseError.call(this, this.message);
  };

  util.inherits(NoParametersError, BaseError);

  return NoParametersError;
};
