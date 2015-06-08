'use strict';

var _ = require('lodash');

module.exports = function (commands, container, logger, messages) {
  return {
    get: get
  };

  function get(args) {
    var commandName = args._[0];

    if (args._.length < 1) {
      return Promise.reject(messages.usage());
    }

    if (!_.includes(commands, commandName)) {
      return Promise.reject(messages.unknown(commandName));
    }
    logger.info('Parsed input and found command: ' + args._[0]);

    return Promise.resolve(container.get(commandName + 'Command'));
  }
};
