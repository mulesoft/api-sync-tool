'use strict';

var omelette = require('omelette');

module.exports = function (commandFactory, commandRunner, commands, logger,
    process) {
  return {
    run: function (args) {
      // Setup autocomplete.
      setupAutocomplete();

      return commandFactory.get(args)
        .then(function (command) {
          logger.debug('Running command');
          return commandRunner.run(command, args);
        })
        .then(successExit)
        .catch(abortExit);
    }
  };

  function setupAutocomplete() {
    var complete = omelette('api-sync <command>');

    complete.on('command', function () {
      this.reply(commands);
    });

    // Initialize the omelette.
    complete.init();
  }

  function successExit() {
    // Log successful exit.
    logger.debug('Command completed successfully');
  }

  function abortExit(output) {
    // Only exit after the last message was logged.
    logger.onComplete(output, function () {
      process.exit(1);
    });

    logger.error(output);

    return Promise.reject(output);
  }
};
