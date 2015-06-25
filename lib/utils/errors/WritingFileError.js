'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * The client was call with no parameters at all
   */
  var WritingFileError = function () {
    this.message = messages.savingFileError();
    BaseError.call(this, this.message);
  };

  util.inherits(WritingFileError, BaseError);

  return WritingFileError;
};
