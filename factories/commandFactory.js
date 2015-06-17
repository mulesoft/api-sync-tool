'use strict';

var _ = require('lodash');

module.exports = function (commands, container, logger, errors) {
  return {
    get: get
  };

  function get(args) {
    var commandName = args._[0];

    if (args._.length < 1) {
      return Promise.reject(new errors.NoParametersError());
    }

    if (!_.includes(commands, commandName)) {
      return Promise.reject(new errors.UnknownCommandError(commandName));
    }
    logger.debug('Parsed input and found command: ' + args._[0]);

    return Promise.resolve(container.get(commandName + 'Command'));
  }
};
