'use strict';

var _ = require('lodash');
var path = require('path');

module.exports = function (BPromise, errors, fs, osenv, process) {
  return {
    get: get,
    getAll: getAll,
    exists: exists,
    update: update,
    del: del
  };

  /**
   * Returns the workspace for the current working directory.
   * If it doesn't exist, it creates a new one.
   *
   * @return {Object} The workspace object for the current directory.
   */
  function get() {
    var workspaces = read();
    var currentWorkspace = _.find(workspaces, 'directory', process.cwd());

    if (!currentWorkspace) {
      currentWorkspace = {
        directory: process.cwd()
      };
    }

    return BPromise.resolve(currentWorkspace);
  }

  /**
   * Returns all created workspaces.
   *
   * @return {Array} All worspaces that were setup in the current environment
   */
  function getAll() {
    var workspaces = read();

    return BPromise.resolve(workspaces);
  }

  /**
   * Returns if there is a workspace in the current working directory.
   *
   * @return {Bool}
   */
  function exists() {
    var workspaces = read();
    var currentWorkspace = _.find(workspaces, 'directory', process.cwd());

    return BPromise.resolve(!!currentWorkspace);
  }

  /**
   * Updates the current directory workspace.
   *
   * @param {Object} workspace The current directory workspace.
   */
  function update(workspace) {
    if (workspace.directory !== process.cwd()) {
      return BPromise.reject(new errors.WrongDirectoryError());
    }
    var workspaces = read();

    // Remove old current directory workspace.
    workspaces = _.reject(workspaces, 'directory', process.cwd());
    // Add new current directory workspace.
    workspaces.push(workspace);

    write(workspaces);

    return BPromise.resolve();
  }

  /**
   * Remove workspace for current directory.
   */
   function del() {
     var workspaces = read();

     write(_.reject(workspaces, 'directory', process.cwd()));

     return BPromise.resolve();
   }

  /**
   * Reads the workspaces from the filesystem.
   * If it doesn't exist, it creates a new one with an empty array.
   *
   * @return {Array} The workspaces array.
   */
  function read() {
    var workspaceFilePath = getWorkspaceFilePath();
    try {
      return JSON.parse(fs.readFileSync(workspaceFilePath, {encoding: 'utf8'}));
    } catch (error) {
      return [];
    }
  }

  /**
   * Writes the workspaces to the filesystem as string.
   *
   * @param {Array} workspaces The workspaces array.
   */
  function write(workspaces) {
    fs.writeFileSync(getWorkspaceFilePath(), JSON.stringify(workspaces),
      {encoding: 'utf8'});
  }

  function getWorkspaceFilePath() {
    return path.join(osenv.home(), '.api-sync');
  }
};
