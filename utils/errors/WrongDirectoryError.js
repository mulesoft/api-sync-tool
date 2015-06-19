'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * The workspace directory and the current directory don't match
   */
  var WrongDirectoryError = function () {
    this.message = messages.invalidDirectory();
    BaseError.call(this, this.message);
  };

  util.inherits(WrongDirectoryError, BaseError);

  return WrongDirectoryError;
};
