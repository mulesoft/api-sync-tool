'use strict';

module.exports = function (logger, messages, setupController, setupStrategyFactory) {
  return {
    validateInput: validateInput,
    execute: execute,
    noSetupNeeded: true
  };

  function validateInput(args) {
    if (!args.i && (!args.bizGroup || !args.apiId || !args.apiVersionId)) {
      return Promise.reject(messages.commandUsage('setup', null,
        [
          'i',
          [
            'bizGroup',
            'apiId',
            'apiVersionId'
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
        apiId: args.apiId,
        apiVersionId: args.apiVersionId
      });
    }
  }

  function print(newWorkspace) {
    logger.info(messages.setupSuccessful(newWorkspace));
  }
};
