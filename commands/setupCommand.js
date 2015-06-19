'use strict';

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
