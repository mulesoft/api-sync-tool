'use strict';

var _ = require('lodash');

var apiFilesRepository = require('../repositories/apiFilesRepository');
var fsRepository = require('../repositories/fileSystemRepository');
var configurationRepository = require('../repositories/configurationRepository');

module.exports = {
  execute: function (api) {
    return apiFilesRepository.pull(api)
      .then(function (files) {
        files.forEach(function (file) {
          return fsRepository.writeFile(file);
        });

        var currentConfig = configurationRepository.getCurrentConfig();
        currentConfig.files = _.map(files, function (file) {
          return _.omit(file, 'data');
        });
        configurationRepository.updateCurrentConfiguration(currentConfig);

        return files;
      });
  }
};
