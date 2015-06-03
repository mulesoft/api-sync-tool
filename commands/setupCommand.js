'use strict';

module.exports = function (console, messages, setupController, setupStrategyFactory, workspaceRepository) {
  return {
    validateInput: validateInput,
    execute: execute,
    noSetupNeeded: true
  };

  function validateInput(args) {
    if (!args.i && (!args.subOrg || !args.apiId || !args.apiVersionId)) {
      return Promise.reject(messages.commandUsage('setup', null,
        [
          'i',
          [
            'subOrg',
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
      .then(function (newWorkspace) {
        var workspace = workspaceRepository.get();
        workspace.api = newWorkspace.api;
        workspace.apiVersion = newWorkspace.apiVersion;
        workspace.subOrg = newWorkspace.subOrg;
        workspaceRepository.update(workspace);

        return newWorkspace;
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
        subOrg: args.subOrg,
        apiId: args.apiId,
        apiVersionId: args.apiVersionId
      });
    }
  }

  function print(newWorkspace) {
    console.log(messages.setupSuccessful(newWorkspace));
  }
};
