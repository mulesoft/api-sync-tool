'use strict';

module.exports = function (logger, messages, setupController, setupStrategyFactory) {
  return {
    validateInput: validateInput,
    execute: execute,
    noSetupNeeded: true
  };

  function validateInput(args) {
    if (!args.i && (!args.bizGroup || !args.api || !args.apiVersion)) {
      return Promise.reject(messages.commandUsage('setup', null,
        [
          {
            name: 'i',
            description: messages.interactiveDescription()
          },
          [
            {
              name: 'bizGroup',
              description: messages.businessGroupDescription()
            },
            {
              name: 'api',
              description: messages.apiDescription()
            },
            {
              name: 'apiVersion',
              description: messages.apiVersionDescription()
            }
          ]
        ]));
    }

    return Promise.resolve();
  }

  function execute(args) {
    return parse(args)
      .then(function (parameters) {
        return setupController.setup(setupStrategyFactory.get(parameters));
      })
      .then(print);
  }

  function parse(args) {
    if (args.i) {
      return Promise.resolve({
        isInteractive: args.i
      });
    } else {
      return Promise.resolve({
        bizGroup: args.bizGroup,
        api: args.api,
        apiVersion: args.apiVersion
      });
    }
  }

  function print(newWorkspace) {
    logger.info(messages.setupSuccessful(newWorkspace));
  }
};
