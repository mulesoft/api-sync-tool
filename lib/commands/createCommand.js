'use strict';

module.exports = function (logger, messages, createController, pushCommand,
    setupCommand, validateNoSetupDoneStrategy, workspaceRepository, errors) {
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
      api: args.api,
      apiVersion: args.apiVersion,
      rootRamlPath: args.rootRaml
    };
  }

  function validateInput(args) {
    if (!args.bizGroup || !args.api || !args.apiVersion || !args.rootRaml) {
      return Promise.reject(new errors.WrongArgumentsError('create',
        [
          [
            {
              name: 'bizGroup',
              description: messages.businessGroupDescription()
            },
            {
              name: 'api',
              description: messages.apiNameDescription()
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

    return Promise.resolve();
  }

  function execute(args) {
    logger.info(messages.creatingAPI());
    return createController.create(args)
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
};
