'use strict';

var _ = require('lodash');

module.exports = function (logger, messages, pullController, setupController,
  setupStrategyFactory, workspaceRepository, pullCommand, errors) {
  return {
    validateSetup: validateSetup,
    validateInput: validateInput,
    execute: execute
  };

  function validateSetup() {
    if (workspaceRepository.exists()) {
      var workspace = workspaceRepository.get();
      return Promise.reject(new errors.SetupAlreadyDoneError(
        workspace.bizGroup.name,
        workspace.api.name,
        workspace.apiVersion.name));
    }

    return Promise.resolve();
  }

  function validateInput(args) {
    if (useInteractiveMode(args) || (args.bizGroup && args.api && args.apiVersion)) {
      return Promise.resolve();
    }

    return Promise.reject(new errors.WrongArgumentsError('setup', usage()));
  }

  function execute(args) {
    var runPull;
    return parse(args)
      .then(setupStrategyFactory.get)
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

  function parse(args) {
    if (useInteractiveMode(args)) {
      return Promise.resolve({
        isInteractive: true
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
