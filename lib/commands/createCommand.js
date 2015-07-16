'use strict';

var _ = require('lodash');

module.exports = function (BPromise, errors, logger, messages, createController,
    createStrategyFactory, pushCommand, setupCommand,
    validateNoSetupDoneStrategy) {
  return {
    getHelp: messages.createDetailedHelp,
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
    }

    return {
      bizGroup: args.bizGroup,
      apiId: args.apiId,
      apiName: args.apiName,
      apiVersion: args.apiVersion,
      rootRamlPath: args.rootRaml
    };
  }

  function validateInput(args) {
    if (useInteractiveMode(args) ||
        args.bizGroup &&
        args.rootRaml &&
        xor(args.apiId, args.apiName) &&
        args.apiVersion) {
      return BPromise.resolve();
    }

    return BPromise.reject(new errors.WrongArgumentsError('create',
      [
        [
          {
            name: 'bizGroup',
            description: messages.businessGroupDescription()
          },
          {
            type: 'xor',
            options: [
              {
                name: 'apiName',
                description: messages.apiNameDescription()
              },
              {
                name: 'apiId',
                description: messages.apiDescription()
              }
            ]
          },
          {
            name: 'apiVersion',
            description: messages.apiVersionNameDescription()
          },
          {
            name: 'rootRaml',
            description: messages.rootRamlDescription()
          }
        ]
      ]));
  }

  function execute(args) {
    return BPromise.resolve(createStrategyFactory.get(args))
      .then(createController.create)
      .then(function (api) {
        logger.info(messages.settingEnvironment());
        return setupCommand.execute({
          bizGroup: api.organizationId,
          api: api.id,
          apiVersion: api.version.id
        });
      })
      .then(pushCommand.execute);
  }

  function useInteractiveMode(args) {
    return args._.length === 1 && _.keys(args).length === 1;
  }

  function xor(a, b) {
    return a ? !b : b;
  }
};
