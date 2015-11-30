'use strict';

var containerFactory = require('./containerFactory');
var container = containerFactory.createContainer();

var APISync = function () {
  return {
    getAllWorkspaces: getAllWorkspaces,
    login: container.get('authenticationService').login,
    cleanup: cleanup,
    create: create,
    pull: pull,
    push: push,
    pushForce: pushForce,
    setup: setup,
    status: status
  };

  /**
   * Returns all existing workspaces in the API Sync configuration.
   *
   * @return {Array} An array of all the configured workspaces.
   */
  function getAllWorkspaces() {
    return container.get('workspaceRepository').getAll();
  }

  /**
   * Cleans up the specified directory configuration. The stored configuration
   * for this directory (choices made about Business Group, API Version) will be
   * no longer available.
   *
   * @param  {String} directory The path to the directory which configuration is
   *                            being cleaned up.
   * @param  {String} accessToken A valid CS access token.
   * @return {Promise} A promise.
   */
  function cleanup(directory, accessToken) {
    return doInContext(directory, accessToken, function () {
      return container.get('cleanupController').cleanup();
    });
  }

  /**
   * Runs create for the specified directory using the specified strategy.
   *
   * @param  {String} directory The path of the user directory.
   * @param  {String} accessToken A valid CS access token.
   * @param  {Object} strategy An object containing a set of functions to be
   *                           used during the create process.
   * @return {Promise} A Promise that will return the create API when resolved.
   */
  function create(directory, accessToken, strategy) {
    return doInContext(directory, accessToken, function () {
      return container.get('createController').create(strategy);
    });
  }

  /**
   * Runs the setup for the specified directory using the specified strategy.
   *
   * @param  {String} directory The path of the user directory.
   * @param  {String} accessToken A valid CS access token.
   * @param  {Object} strategy An object containing a set of functions to be
   *                           used during the setup process.
   * @return {Promise} A Promise that will return a result containing the
   *                   generated workspace when resolved.
   */
  function setup(directory, accessToken, strategy) {
    return doInContext(directory, accessToken, function () {
      return container.get('setupController').setup(strategy);
    });
  }

  /**
   * Runs a pull for the specified directory.
   *
   * @param  {String} directory The path of the user directory.
   * @param  {String} accessToken A valid CS access token.
   * @return {Promise} A Promise that will return an Array with all API files
   *                   metadata.
   */
  function pull(directory, accessToken) {
    return doInContext(directory, accessToken, function () {
      return container.get('pullController').getAPIFiles();
    });
  }

  /**
   * Runs a push for the specified directory.
   *
   * @param  {String} directory The path of the user directory.
   * @param  {String} accessToken A valid CS access token.
   * @return {Promise} A Promise that will return an Array with all files that
   *                   were successfully pushed.
   */
  function push(directory, accessToken) {
    return doInContext(directory, accessToken, function () {
      return container.get('pushController').push();
    });
  }

  /**
   * Runs a push force for the specified directory. It will first remove all
   * files, all directories, updates the root RAML and then pushes all the API
   * files.
   *
   * @param  {String} directory The path of the user directory.
   * @param  {String} accessToken A valid CS access token.
   * @return {Promise} A Promise that will return an Array with all files that
   *                   were successfully pushed.
   */
  function pushForce(directory, accessToken) {
    return doInContext(directory, accessToken, function () {
      return container.get('pushController').forcePush();
    });
  }

  /**
   * Returns the status for the specified directory.
   *
   * @param  {String} directory The path of the user directory.
   * @param  {String} accessToken A valid CS access token.
   * @return {Promise} A Promise that will return an object containing the
   *                  status of all the files in the
   *                  directory and the existing conflicts with the Anypoint
   *                  Platform.
   */
  function status(directory, accessToken) {
    return doInContext(directory, accessToken, function () {
      return container.get('statusController').status();
    });
  }

  /************** UTILITY FUNCTIONS *********************/

  function doInContext(directory, accessToken, callback) {
    setWorkingDirectory(directory);
    setContext(directory, accessToken);

    return callback();
  }

  function setWorkingDirectory(directory) {
    container.get('process').cwd = function () {
      return directory;
    };
  }

  function setContext(directory, accessToken) {
    var contextHolder = container.get('contextHolder');
    var contextFactory = container.get('contextFactory');
    contextHolder.set(contextFactory.create({accessToken: accessToken}, directory));
  }
};

module.exports = APISync;
