'use strict';

var _ = require('lodash');

module.exports = function (logger, messages, pullController, setupController,
  setupStrategyFactory, errors) {
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
    var commandResult = {};
    return parse(args)
      .then(function (parameters) {
        return setupController.setup(setupStrategyFactory.get(parameters));
      })
      .then(function (result) {
        commandResult.workspace = result.workspace;

        if (result.runPull) {
          return pullController.getAPIFiles()
            .then(function (files) {
              commandResult.files = files;
              return commandResult;
            });
        }
        return commandResult;
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
        apiVersion: args.apiVersion,
        runPull: !!args.p
      });
    }
  }

  function print(result) {
    logger.info(messages.setupSuccessful(result.workspace));
    if (result.files) {
      logger.info(messages.status({added: _.pluck(result.files, 'path')}));
    }
  }
};
