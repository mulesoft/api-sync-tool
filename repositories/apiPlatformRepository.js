'use strict';

var apiPlatformUrl = 'https://anypoint.mulesoft.com/apiplatform/repository';

module.exports = function (contextHolder, superagent) {
  return {
    getAllAPIs: getAllAPIs,
    getAllFileEntries: getAllFileEntries,
    getFile: getFile
  };

  function getAllAPIs() {
    return apiClient(superagent.get(apiPlatformUrl + '/apis'))
      .then(buildApisInformation);
  }

  function getAllFileEntries(api) {
    return apiClient(superagent.get(apiPlatformUrl + '/apis/' + api.id + '/versions/' + api.versionId + '/files'))
      .then(function (response) {
        return response.body;
      });
  }

  function getFile(api, fileId) {
    return apiClient(superagent.get(apiPlatformUrl + '/apis/' + api.id + '/versions/' + api.versionId + '/files/' + fileId))
      .then(function (response) {
        return response.body.data;
      });
  }

  function pullAPIFiles(api) {
    return apiClient(superagent.get(apiPlatformUrl + '/apis/' + api.id + '/versions/' + api.versionId + '/files'))
      .then(function (response) {
        var files = response.body;

        return Promise.all(files.map(function (file) {
          return pullUri(api, file);
        }));
      });
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
    return apiClient(superagent.get(apiPlatformUrl + '/apis/' + api.id + '/versions/' + api.versionId + '/files/' + file.id))
      .then(function (response) {
        file.data = response.body.data;

        return file;
      });
  }

  function apiClient(request) {
    return request
      .set('Authorization', 'Bearer ' + contextHolder.get().getToken())
      .set('Accept', 'application/json')
      .end();
  }
};
