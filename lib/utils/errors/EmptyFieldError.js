'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * A field was left empty
   */
  var EmptyFieldError = function () {
    this.message = messages.emptyFieldError();
    BaseError.call(this, this.message);
  };

  util.inherits(EmptyFieldError, BaseError);

  return EmptyFieldError;
};
