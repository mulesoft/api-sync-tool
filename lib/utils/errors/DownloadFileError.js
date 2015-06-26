'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * The client was call with no parameters at all
   */
  var DownloadFileError = function () {
    this.message = messages.downloadFileError();
    BaseError.call(this, this.message);
  };

  util.inherits(DownloadFileError, BaseError);

  return DownloadFileError;
};
