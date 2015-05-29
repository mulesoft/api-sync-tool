'use strict';

var superagent = require('superagent-promise');

var configurationRepository = require('./configurationRepository');

var apiPlatformUrl = 'https://anypoint.mulesoft.com/apiplatform/repository';
var config = getValidatedConfiguration();

module.exports = {
  list: function () {
    return apiClient(superagent.get(apiPlatformUrl + '/apis').set('content-type', 'application/json'))
      .then(buildApisInformation)
      .catch(function (err) {
        throw new Error(err);
      });
  },
  pull: function(api) {
    return apiClient(superagent.get(apiPlatformUrl + '/apis/' + api.id + '/versions/' + api.versionId + '/files'))
      .then(function (response) {
        var files = response.body;
        var promises = [];

        files.forEach(function (file) {
          promises.push(pullUri(api, file));
        });

        return Promise.all(promises);
      })
      .catch(function (err) {
        throw new Error(err);
      });
  }
};

// TODO: find a better place for this validation.
function getValidatedConfiguration() {
  var config = configurationRepository.getCurrentConfig();
  if (!config.authentication) {
    throw new Error('Unauthorized');
  }

  return config;
}

function apiClient(request) {
  return request
    .set('Authorization', 'Bearer ' + config.authentication.access_token)
    .set('Accept', 'application/json')
    .end();
}

function buildApisInformation(response) {
  var apis = [];

  var responseJson = response.body;
  responseJson.apis.forEach(function (api) {
    var anApi = {
      id: api.id,
      name: api.name,
      versions: []
    };

    api.versions.forEach(function (version) {
      anApi.versions.push({
        id: version.id,
        name: version.name
      });
    });

    apis.push(anApi);
  });

  return apis;
}

function pullUri(api, file) {
  return superagent.get(apiPlatformUrl + '/apis/' + api.id + '/versions/' + api.versionId + '/files/' + file.id)
    .set('Authorization', 'Bearer ' + config.authentication.access_token)
    .set('Accept', 'application/json')
    .end()
    .then(function (response) {
      file.data = response.body;

      return file;
    });
}
