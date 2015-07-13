'use strict';

var _ = require('lodash');

module.exports = function (BPromise, commands, container, logger, errors) {
  return {
    get: get
  };

  function get(args) {
    var commandName = args._[0];

    if (args._.length < 1) {
      return BPromise.reject(new errors.NoParametersError());
    }

    if (!_.includes(commands, commandName)) {
      return BPromise.reject(new errors.UnknownCommandError(commandName));
    }
    logger.debug('Parsed input and found command: ' + args._[0]);

    return BPromise.resolve(container.get(commandName + 'Command'));
  }
};
