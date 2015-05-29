'use strict';

var fs = require('fs');
var path = require('path');
var osenv = require('osenv');
var _ = require('lodash');

var configFilePath = path.join(osenv.home(), '.api-sync');

module.exports = {
  /**
   * Returns the configuration for the current working directory. If it doesn't exist, it creates a new one.
   *
   * @return {Object} The configuration object for the current directory.
   */
  getCurrentConfig: function () {
    var configuration = readConfiguration();
    var currentConfigurationSection = _.find(configuration, 'directory', process.cwd());

    if (!currentConfigurationSection) {
      currentConfigurationSection = {
        directory: process.cwd()
      };
      configuration.push(currentConfigurationSection);
      writeConfiguration(configuration);
    }

    return currentConfigurationSection;
  },

  /**
   * Updates the current directory configuration.
   *
   * @param  {Object} configurationSection The current directory configuration.
   */
  updateCurrentConfiguration: function (configurationSection) {
    if (configurationSection.directory !== process.cwd()) {
      throw new Error('Invalid directory');
    }
    var configuration = readConfiguration();

    // Remove old current directory configuration.
    configuration = _.reject(configuration, 'directory', process.cwd());
    // Add new current directory configuration.
    configuration.push(configurationSection);

    writeConfiguration(configuration);
  }
};

/**
 * Reads the configuration from the configuration file. If it doesn't exist, it creates a new one with an empty array.
 *
 * @return {Object} The configuration file.
 */
function readConfiguration() {
  try {
    return JSON.parse(fs.readFileSync(configFilePath));
  } catch (error) {
    writeConfiguration([]);

    return JSON.parse(fs.readFileSync(configFilePath));
  }
}

/**
 * Writes the configuration to the configuration file as string.
 *
 * @param  {Object} configuration The configuration object.
 */
function writeConfiguration(configuration) {
  fs.writeFileSync(configFilePath, JSON.stringify(configuration));
}
