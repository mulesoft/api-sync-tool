'use strict';

var omelette = require('omelette');

module.exports = function (commandFactory, commandRunner, commands, logger) {
  return {
    run: function (args) {
      // Setup autocomplete.
      setupAutocomplete();

      commandFactory.get(args)
        .then(function (command) {
          logger.info('Running command');
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
    logger.info('Command completed successfully');
    process.exit(0);
  }

  function abortExit(output) {
    logger.error(output.toString());
    // Wait for logger to finish writing logs before exit.
    logger.onFlush(function () {
      console.error(output);
      process.exit(1);
    });
  }
};
