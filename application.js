'use strict';

var omelette = require('omelette');

module.exports = function (commandFactory, commandRunner, commands) {
  return {
    run: function (args) {
      // Setup autocomplete.
      setupAutocomplete();

      commandFactory.get(args)
        .then(function (command) {
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
    process.exit(0);
  }

  function abortExit(output) {
    console.error(output);
    process.exit(1);
  }
};
