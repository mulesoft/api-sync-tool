'use strict';

var _ = require('lodash');
var path = require('path');

var apiPlatformUrl = 'https://anypoint.mulesoft.com/apiplatform/repository/v2';

module.exports = function (contextHolder, errors, superagent) {
  return {
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles,
    getAPIFilesMetadata: getAPIFilesMetadata,
    createAPIDir: createAPIDir,
    createAPIFile: createAPIFile,
    updateAPIFile: updateAPIFile,
    deleteAPIFile: deleteAPIFile
  };

  function getAllAPIs(organizationId) {
    return apiClient(sort(superagent.get(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/')))
      .then(buildApisInformation)
      .catch(function (err) {
        return Promise.reject(checkUnauthorized(err));
      });
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
      apiClient(superagent.get(apiPlatformUrl +
        '/organizations/' + organizationId +
        '/apis/' + apiId +
        '/versions/' + apiVersionId +
        '/files/export'),
        function (err, response) {
          if (err) {
            return reject(checkUnauthorized(err));
          }

          var piping = response.pipe(stream);
          piping.on('close', function () {
            resolve();
          });
          // TODO: Test this event catches errors
          piping.on('error', function () {
            reject(new errors.WritingFileError());
          });
        });
      });
  }

  function getAPIFilesMetadata(organizationId, apiId, apiVersionId) {
    return apiClient(superagent.get(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files'))
      .then(function (response) {
        return response.body;
      })
      .catch(function (err) {
        return Promise.reject(checkUnauthorized(err));
      });
  }

  function createAPIDir(organizationId, apiId, apiVersionId, newDir) {
    var dir = {
      name: path.basename(newDir.path),
      parentId: newDir.parentId,
      isDirectory: true,
      path: newDir.path
    };

    return createResource(organizationId, apiId, apiVersionId, dir);
  }

  function createAPIFile(organizationId, apiId, apiVersionId, newFile) {
    var file = {
      name: path.basename(newFile.path),
      parentId: newFile.parentId,
      data: newFile.data.toString(),
      isDirectory: false,
      path: newFile.path
    };

    return createResource(organizationId, apiId, apiVersionId, file);
  }

  function createResource(organizationId, apiId, apiVersionId, newEntry) {
    return apiClient(superagent.post(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files')
      .set('Content-Type', 'application/json')
      .send(newEntry))
      .then(function (response) {
        var createdEntry = response.body;
        return {
          path: newEntry.path,
          id: createdEntry.id
        };
      })
      .catch(function (err) {
        return Promise.reject(checkUnauthorized(err));
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
      'organizationId',
      'parentId'
    ]);

    return apiClient(superagent.put(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files/' + updatedFile.id)
      .set('Content-Type', 'application/json')
      .send(file))
      .then(function () {
        return updatedFile.path;
      })
      .catch(function (err) {
        return Promise.reject(checkUnauthorized(err));
      });
  }

  function deleteAPIFile(organizationId, apiId, apiVersionId, deletedFile) {
    return apiClient(superagent.del(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files/' + deletedFile.id))
      .then(function () {
        return deletedFile.path;
      })
      .catch(function (err) {
        return Promise.reject(checkUnauthorized(err));
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

  function sort(request) {
    return request.query({sort: 'name', ascending: true});
  }

  function checkUnauthorized(error) {
    if (error.status === 401) {
      return new errors.BadCredentialsError();
    } else {
      return error;
    }
  }
};
