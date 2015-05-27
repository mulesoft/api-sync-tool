'use strict';

var fs = require('fs');
var path = require('path');
var osenv = require('osenv');
var _ = require('lodash');

var configFilePath = path.join(osenv.home(), '.api-sync');

module.exports = {
  readConfigFile: function (unsafe) {
    try {
      return JSON.parse(fs.readFileSync(configFilePath));
    } catch (error) {
      if (unsafe) {
        return false;
      }
      console.log('Please login to Anypoint Platform (api-sync login)');
      process.exit(0);
    }
  },
  getCurrentConfig: function (unsafe) {
    var configurationFile = this.readConfigFile(unsafe);
    var configurationSection = _.find(configurationFile, function (configSection) {
      return configSection.directory === process.cwd();
    });

    return configurationSection;
  },
  writeConfigFile: function (config) {
    var configurationFile = this.readConfigFile(true);
    if (!configurationFile) {
      configurationFile = [];
    }
    configurationFile.push(config);
    fs.writeFileSync(configFilePath, JSON.stringify(configurationFile));
  },
  getLoginUrl: function () {
    return 'https://anypoint.mulesoft.com/accounts/oauth2/token';
  },
  getApiPlatformBaseUrl: function () {
    return 'https://anypoint.mulesoft.com/apiplatform/repository';
  },
  newFile: function (file, api) {
    return {
      isDirectory: false,
      apiId: api.id,
      apiVersionId: api.versionId,
      name: file,
      data: fs.readFileSync(file, 'utf8')
    };
  },
  getHeaders: function (authentication) {
    return {
      headers: {
        Authorization: 'Bearer ' + authentication.access_token,
        'content-type': 'application/json'
      }
    };
  }
};
