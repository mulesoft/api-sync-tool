'use strict';

module.exports = function (BaseError, BPromise, commandFactory, commandRunner,
    commands, errors, logger, messages, omelette, process) {
  return {
    run: function (args) {
      setupAutocomplete();

      return commandFactory.get(args)
        .then(function (command) {
          if (args.help) {
            logger.info(command.getHelp());
          } else {
            logger.debug('Running command');
            return commandRunner.run(command, args);
          }
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

    if (output instanceof BaseError) {
      logger.error(output);
    } else {
      logger.error(messages.unexpectedError());
      logger.debug(output);
    }

    return BPromise.reject(output);
  }
};
