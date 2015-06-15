'use strict';

var _ = require('lodash');
var path = require('path');

var apiPlatformUrl = 'https://anypoint.mulesoft.com/apiplatform/repository';

module.exports = function (contextHolder, messages, superagent) {
  return {
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles,
    getAPIFilesMetadata: getAPIFilesMetadata,
    createAPIFile: createAPIFile,
    updateAPIFile: updateAPIFile,
    deleteAPIFile: deleteAPIFile
  };

  function getAllAPIs() {
    return apiClient(superagent.get(apiPlatformUrl + '/apis'))
      .then(buildApisInformation);
  }

  /**
   * Pulls the API files compressed in a ZIP file and saves it to a stream
   *
   * @param {Object} organizationId The id of the organization where the API is
   * @param {Object} apiId The API to download
   * @param {Object} apiVersionId The version to download
   * @param {Object} stream A stream to send to the zip file to
   */
  function getAPIFiles(organizationId, apiId, apiVersionId, stream) {
    // TODO The callback in apiClient is the only way we found to make
    // response.pipe work. Doing it without the callback didn't work.
    return new Promise(function (resolve, reject) {
      apiClient(superagent.get(apiPlatformUrl + '/v2' +
        '/organizations/' + organizationId +
        '/apis/' + apiId +
        '/versions/' + apiVersionId +
        '/files/export'),
        function (err, response) {
          if (err) {
            return reject(err);
          }

          var piping = response.pipe(stream);
          piping.on('close', function () {
            resolve();
          });
          // TODO: Improve the message error and move it to messages
          // TODO: Test this event catches errors
          piping.on('error', function () {
            reject(new Error(messages.savingFileError()));
          });
        });
      });
  }

  function getAPIFilesMetadata(organizationId, apiId, apiVersionId) {
    return apiClient(superagent.get(apiPlatformUrl + '/v2' +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files'))
      .then(function (response) {
        return response.body;
      });
  }

  function createAPIFile(organizationId, apiId, apiVersionId, newFile) {
    var file = {
      name: path.basename(newFile.path),
      path: newFile.path,
      data: newFile.data.toString(),
      isDirectory: false
    };

    return apiClient(superagent.post(apiPlatformUrl + '/v2' +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files')
      .set('Content-Type', 'application/json')
      .send(file))
      .then(function () {
        return newFile.path;
      });
  }

  function updateAPIFile(organizationId, apiId, apiVersionId, updatedFile) {
    var file = _.pick(updatedFile, [
      'id',
      'name',
      'path',
      'data',
      'isDirectory',
      'apiVersionId',
      'organizationId'
    ]);

    return apiClient(superagent.put(apiPlatformUrl + '/v2' +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files/' + updatedFile.id)
      .set('Content-Type', 'application/json')
      .send(file))
      .then(function () {
        return updatedFile.path;
      });
  }

  function deleteAPIFile(organizationId, apiId, apiVersionId, deletedFile) {
    return apiClient(superagent.del(apiPlatformUrl + '/v2' +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files/' + deletedFile.id))
      .then(function () {
        return deletedFile.path;
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

  function apiClient(request, callback) {
    return request
      .set('Authorization', 'Bearer ' + contextHolder.get().getToken())
      .set('Accept', 'application/json')
      .end(callback);
  }
};
