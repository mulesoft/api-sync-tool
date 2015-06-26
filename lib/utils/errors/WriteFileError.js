'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * The client was call with no parameters at all
   */
  var WriteFileError = function () {
    this.message = messages.saveFileError();
    BaseError.call(this, this.message);
  };

  util.inherits(WriteFileError, BaseError);

  return WriteFileError;
};
