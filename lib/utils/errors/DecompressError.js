'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * The client was call with no parameters at all
   */
  var DecompressError = function (filePath, error) {
    this.message = messages.decompressError(filePath, error);
    BaseError.call(this, this.message);
  };

  util.inherits(DecompressError, BaseError);

  return DecompressError;
};
