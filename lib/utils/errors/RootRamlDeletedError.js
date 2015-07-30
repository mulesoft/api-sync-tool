'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The root RAML was deleted in the local directory
   *
   * @param {String} rootRamlPath The path of the root RAML
   */
  var RootRamlDeletedError = function (rootRamlPath) {
    this.message = messages.deletedRootRamlConflict(rootRamlPath);
    BaseError.call(this, this.message);
  };

  util.inherits(RootRamlDeletedError, BaseError);
  return RootRamlDeletedError;
};
