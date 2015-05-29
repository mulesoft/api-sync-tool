'use strict';

var omelette = require('omelette');

module.exports = function (commandFactory, commands, container, contextFactory, contextHolder) {
  return {
    run: function (args) {
      // Setup autocomplete.
      var complete = omelette('api-sync <command>');

      complete.on('command', function () {
        this.reply(commands);
      });

      // Initialize the omelette.
      complete.init();

      commandFactory.get(args)
        .then(function (command) {
          if (command.noContext) {
            return command.execute(args);
          } else {
            var context = contextFactory.create();

            contextHolder.set(context);

            return validate(context)
              .then(function () {
                return command.execute(args);
              });
          }
        })
        .then(successExit)
        .catch(abortExit);
    }
  };

  function validate(context) {
    if (!context.getToken()) {
      return Promise.reject('Unauthorized');
    }

    return Promise.resolve();
  }

  function successExit() {
    process.exit(0);
  }

  function abortExit(output) {
    console.error(output);
    process.exit(1);
  }
};
