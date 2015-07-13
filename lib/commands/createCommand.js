'use strict';

module.exports = function (BPromise, logger, messages, createController,
    pushCommand, setupCommand, validateNoSetupDoneStrategy,
    workspaceRepository, errors) {
  return {
    getHelp: messages.createDetailedHelp,
    parseArgs: parseArgs,
    validateSetup: validateNoSetupDoneStrategy,
    validateInput: validateInput,
    execute: execute
  };

  function parseArgs(args) {
    return {
      bizGroup: args.bizGroup,
      apiId: args.apiId,
      apiName: args.apiName,
      apiVersion: args.apiVersion,
      rootRamlPath: args.rootRaml
    };
  }

  function validateInput(args) {
    if (!args.bizGroup ||
        !args.rootRaml ||
        !xor(args.apiId, args.apiName) ||
        !args.apiVersion) {
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

    return BPromise.resolve();
  }

  function execute(args) {
    logger.info(messages.creatingAPI());
    var createStrategy = isCreatingNewAPI(args) ?
      createController.createAPI : createController.createAPIVersion;

    return createStrategy(args)
      .then(print)
      .then(function (api) {
        return setupCommand.execute({
          bizGroup: api.organizationId,
          api: api.id,
          apiVersion: api.version.id
        });
      })
      .then(pushCommand.execute);
  }

  function print(api) {
    logger.info(messages.settingEnvironment());
    return api;
  }

  function isCreatingNewAPI(args) {
    return !!args.apiName;
  }

  function xor(a, b) {
    return a ? !b : b;
  }
};
