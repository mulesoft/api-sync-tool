'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The name for a new API is already in use
   *
   * @param {String} apiId The API id
   * @param {String} apiName The API name
   */
  var RepeatedAPINameError = function (apiId, apiName) {
    this.message = messages.repeatedAPINameError(apiId, apiName);
    BaseError.call(this, this.message);
  };

  util.inherits(RepeatedAPINameError, BaseError);

  return RepeatedAPINameError;
};
