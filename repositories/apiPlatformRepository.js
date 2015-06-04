'use strict';

var apiPlatformUrl = 'https://anypoint.mulesoft.com/apiplatform/repository';

module.exports = function (contextHolder, messages, superagent) {
  return {
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles
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
    return new Promise(function (resolve, reject) {
      apiClient(superagent.get(apiPlatformUrl + '/v2' +
        '/organizations/' + organizationId +
        '/apis/' + apiId +
        '/versions/' + apiVersionId +
        '/files/export'),
        function (err, response) {
          if (err) {
            reject(err);
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
