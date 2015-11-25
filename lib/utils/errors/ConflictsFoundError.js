'use strict';

var util = require('util');

module.exports = function (BaseError, messages) {
  /**
   * Conflicts were found while pushing.
   *
   * @param {String} conflicts The conflicts parameter with all conflicts found
   */
  var ConflictsFoundError = function (conflicts) {
    this.conflicts = conflicts;
    this.message = messages.conflictsFound(conflicts);
    BaseError.call(this, this.message);
  };

  util.inherits(ConflictsFoundError, BaseError);
  ConflictsFoundError.prototype.name   = 'ConflictsFoundError';

  return ConflictsFoundError;
};
