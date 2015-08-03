'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The workspace directory and the current directory don't match
   */
  var setupAlreadyDoneError = function (bizGroupName, apiName, apiVersionName) {
    this.message = messages.setupAlreadyDoneError(
      bizGroupName, apiName, apiVersionName);
    BaseError.call(this, this.message);
  };
  util.inherits(setupAlreadyDoneError, BaseError);

  return setupAlreadyDoneError;
};
