'use strict';

module.exports = function (logger, messages, pullController, setupController,
  setupStrategyFactory, pullCommand, errors) {
  return {
    validateInput: validateInput,
    execute: execute,
    noSetupNeeded: true
  };

  function validateInput(args) {
    if (!args.i && (!args.bizGroup || !args.api || !args.apiVersion)) {
      return Promise.reject(new errors.WrongArgumentsError('setup',
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
            },
            {
              name: 'p',
              description: messages.runPullDescription()
            }
          ]
        ]));
    }

    return Promise.resolve();
  }

  function execute(args) {
    var runPull;
    return parse(args)
      .then(function (parameters) {
        return setupController.setup(setupStrategyFactory.get(parameters));
      })
      .then(function (result) {
        runPull = result.runPull;
        return result.workspace;
      })
      .then(print)
      .then(function () {
        if (runPull) {
          return pullCommand.execute();
        }
      });
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
        apiVersion: args.apiVersion,
        runPull: !!args.p
      });
    }
  }

  function print(workspace) {
    logger.info(messages.setupSuccessful(workspace));
  }
};
