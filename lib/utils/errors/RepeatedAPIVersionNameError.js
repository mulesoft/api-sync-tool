'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The name for a new API is already in use
   *
   * @param {String} versionId The API version id
   * @param {String} versionName The API version name
   */
  var RepeatedAPIVersionNameError = function (versionId, versionName) {
    this.message = messages.repeatedAPIVersionNameError(versionId, versionName);
    BaseError.call(this, this.message);
  };

  util.inherits(RepeatedAPIVersionNameError, BaseError);

  return RepeatedAPIVersionNameError;
};
