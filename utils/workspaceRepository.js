'use strict';

var fs = require('fs');
var path = require('path');
var osenv = require('osenv');
var _ = require('lodash');

module.exports = function (messages) {
  var workspaceFilePath = path.join(osenv.home(), '.api-sync');

  return {
    get: get,
    update: update
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
      workspaces.push(currentWorkspace);
      write(workspaces);
    }

    return currentWorkspace;
  }

  /**
   * Updates the current directory workspace.
   *
   * @param {Object} workspace The current directory workspace.
   */
  function update(workspace) {
    if (workspace.directory !== process.cwd()) {
      throw new Error(messages.invalidDirectory());
    }
    var workspaces = read();

    // Remove old current directory workspace.
    workspaces = _.reject(workspaces, 'directory', process.cwd());
    // Add new current directory workspace.
    workspaces.push(workspace);

    write(workspaces);
  }

  /**
   * Reads the workspaces from the filesystem.
   * If it doesn't exist, it creates a new one with an empty array.
   *
   * @return {Array} The workspaces array.
   */
  function read() {
    try {
      return JSON.parse(fs.readFileSync(workspaceFilePath));
    } catch (error) {
      write([]);

      return JSON.parse(fs.readFileSync(workspaceFilePath));
    }
  }

  /**
   * Writes the workspaces to the filesystem as string.
   *
   * @param {Array} workspaces The workspaces array.
   */
  function write(workspaces) {
    fs.writeFileSync(workspaceFilePath, JSON.stringify(workspaces));
  }
};
