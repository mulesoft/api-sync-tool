'use strict';

var _ = require('lodash');

module.exports = function (BPromise, logger, messages, pullController,
    setupController, setupStrategyFactory, validateNoSetupDoneStrategy,
    workspaceRepository, pullCommand, errors) {
  return {
    getHelp: messages.setupDetailedHelp,
    parseArgs: parseArgs,
    validateSetup: validateNoSetupDoneStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function parseArgs(args) {
    if (useInteractiveMode(args)) {
      return {
        isInteractive: true
      };
    } else {
      return {
        bizGroup: args.bizGroup,
        api: args.api,
        apiVersion: args.apiVersion,
        runPull: !!args.p
      };
    }
  }

  function validateInput(args) {
    if (useInteractiveMode(args) || (args.bizGroup && args.api && args.apiVersion)) {
      return BPromise.resolve();
    }

    return BPromise.reject(new errors.WrongArgumentsError('setup', usage()));
  }

  function execute(args) {
    var runPull;
    return BPromise.resolve(setupStrategyFactory.get(args))
      .then(setupController.setup)
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

  function print(workspace) {
    logger.info(messages.setupSuccessful(workspace));
  }

  function useInteractiveMode(args) {
    return args._.length === 1 && _.keys(args).length === 1;
  }

  function usage() {
    return [
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
    ];
  }
};
