'use strict';

var util = require('util');

var BaseError = require('./BaseError');

module.exports = function (messages) {
  /**
   * The user needs to setup the workspace first
   */
  var SetupNeededError = function () {
    this.message = messages.setupNeeded();
    BaseError.call(this, this.message);
  };

  util.inherits(SetupNeededError, BaseError);

  return SetupNeededError;
};
