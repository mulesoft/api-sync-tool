'use strict';

var _ = require('lodash');

module.exports = function (commands, container, messages) {
  return {
    get: function (args) {
      var commandName = args._[0];

      if (args._.length < 1) {
        return Promise.reject(messages.usage(commands));
      }

      if (!_.includes(commands, commandName)) {
        return Promise.reject(messages.unknown(commandName, commands));
      }

      return Promise.resolve(container.get(commandName + 'Command'));
    }
  };
};
