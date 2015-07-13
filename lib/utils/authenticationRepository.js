'use strict';

var path = require('path');
var _ = require('lodash');
var properties = require('properties');

module.exports = function (BPromise, errors, fs, logger, messages, osenv,
    process) {
  return {
    get: get,
    update: update,
    del: del
  };

  /**
   * Returns the authentication information for the current directory.
   * If it doesn't exist, it creates a new one.
   *
   * @return {Object} The authentication object for the current directory.
   */
  function get() {
    var authentications = read();
    var currentAuthentication = _.find(authentications, 'directory',
        process.cwd());

    return BPromise.resolve(currentAuthentication ? currentAuthentication : {
      directory: process.cwd()
    });
  }

  /**
   * Updates the current directory authentication.
   *
   * @param {Object} authentication The current directory workspace.
   */
  function update(authentication) {
    if (authentication.directory !== process.cwd()) {
      return BPromise.reject(new errors.WriteFileError());
    }
    var authentications = read();

    // Remove old current directory workspace.
    authentications = _.reject(authentications, 'directory', process.cwd());
    // Add new current directory workspace.
    authentications.push(authentication);

    write(authentications);

    return BPromise.resolve(authentication);
  }

  /**
   * Remove authentication for current directory.
   */
  function del() {
    var authentications = read();

    write(_.reject(authentications, 'directory', process.cwd()));

    return BPromise.resolve();
  }

  /**
   * Reads the authentications from the filesystem.
   * If it doesn't exist, it creates a new one with an empty array.
   *
   * @return {Array} The authentications array.
   */
  function read() {
    var authenticationFilePath = getAuthenticationFilePath();
    try {
      var propertiesFileContent = fs.readFileSync(authenticationFilePath,
          {encoding: 'utf8'});
      var authentication = properties.parse(propertiesFileContent,
          {sections: true});

      return _.isEmpty(authentication) ? [] : _.values(authentication);
    } catch (err) {
      logger.debug(messages.authFileNotFound());

      return [];
    }
  }

  /**
   * Writes the authentications to the filesystem as string.
   *
   * @param {Array} authentications The authentications array.
   */
  function write(authentications) {
    var authenticationFilePath = getAuthenticationFilePath();
    var stringifier = properties.createStringifier();
    var i = 0;
    authentications.forEach(function (authentication) {
      stringifier.section('directory' + i);
      _.forOwn(authentication, function (value, key) {
        stringifier.property({key: key, value: value});
      });
      i++;
    });

    fs.writeFileSync(authenticationFilePath, properties.stringify (stringifier),
        {encoding: 'utf8'});
  }

  function getAuthenticationFilePath() {
    return path.join(osenv.home(), '.api-sync-auth');
  }
};
