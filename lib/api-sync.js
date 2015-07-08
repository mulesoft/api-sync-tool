'use strict';

var containerFactory = require('./containerFactory');
var container = containerFactory.createContainer();

module.exports = function (args) {
  container.get('application')
    .run(args)
    .catch(function () {
      // All errors are handled in application but are bubbled up for testing
      // purposes. Errors are catched here to avoid showing unhandled errors to
      // the user.
    });
};
