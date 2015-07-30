'use strict';

var util = require('util');

module.exports = function () {
  return BaseError;
};

/**
 * Implement the base error class all application errors extend from. This
 * class should never be used directly, but only extended from to create
 * custom error instances. The reason we do this is to appropriately format
 * error messages to the end user in any context. For example, i18n. The
 * message given to the `BaseError` is entirely optional, so I'd suggest
 * using something developer friendly.
 *
 * @param {Object} message A human readable message the error will display.
 * @param {Object} options
 */
function BaseError(message, options) {
  options = options || {};

  this.message = message;

  this.toString = function () {
    return this.message;
  };

  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
}

util.inherits(BaseError, Error);
BaseError.prototype.name = 'BaseError';
