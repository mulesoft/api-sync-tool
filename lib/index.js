'use strict';

var containerFactory = require('./containerFactory');
var container = containerFactory.createContainer();

var APISync = function () {
  return {
    getAllWorkspaces: getAllWorkspaces,
    login: container.get('authenticationService').login,
    pull: pull,
    setup: setup,
    status: status
  };

  function getAllWorkspaces() {
    return container.get('workspaceRepository').getAll();
  }

  function setup(directory, accessToken, strategy) {
    setWorkingDirectory(directory);
    setContext(accessToken, directory);

    return container.get('setupController').setup(strategy);
  }

  function pull(accessToken, directory) {
    setWorkingDirectory(directory);
    setContext(accessToken, directory);

    return container.get('pullController').getAPIFiles(accessToken);
  }

  function status(accessToken, directory) {
    setWorkingDirectory(directory);
    setContext(accessToken, directory);

    return container.get('statusController').status();
  }

  function setWorkingDirectory(directory) {
    container.get('process').cwd = function () {
      return directory;
    };
  }

  function setContext(accessToken, directory) {
    var contextHolder = container.get('contextHolder');
    var contextFactory = container.get('contextFactory');
    contextHolder.set(contextFactory.create({accessToken: accessToken}, directory));
  }
};

module.exports = APISync;
