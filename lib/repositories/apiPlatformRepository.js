'use strict';

var _ = require('lodash');
var path = require('path');

var apiPlatformUrl = 'https://anypoint.mulesoft.com/apiplatform/repository/v2';

module.exports = function (BPromise, contextHolder, errors,
    superagent, superagentCallbacks) {
  return {
    addRootRaml: addRootRaml,
    createAPI: createAPI,
    createAPIVersion: createAPIVersion,
    getAllAPIs: getAllAPIs,
    getAPIFiles: getAPIFiles,
    getAPIFilesMetadata: getAPIFilesMetadata,
    createAPIDirectory: createAPIDirectory,
    deleteAPIDirectory: deleteAPIDirectory,
    createAPIFile: createAPIFile,
    updateAPIFile: updateAPIFile,
    deleteAPIFile: deleteAPIFile
  };

  function addRootRaml(organizationId, apiId, apiVersionId, rootRaml) {
    var newRootRaml = {
      isDirectory: false,
      name: path.basename(rootRaml.path),
      data: rootRaml.data,
      apiId: apiId,
      apiVersionId: apiVersionId
    };
    var request = superagent.post(
        apiPlatformUrl +
        '/organizations/' + organizationId +
        '/apis/' + apiId +
        '/versions/' + apiVersionId +
        '/addRootRaml'
      )
      .send(newRootRaml)
      .type('application/json');

    return apiClient(request)
      .then(function (response) {
        var rootRamlFile = response.body;
        return {
          audit: rootRamlFile.audit,
          path: rootRaml.path,
          id: rootRamlFile.id
        };
      })
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
      });
  }

  function createAPI(organizationId, apiName, versionName) {
    return apiClient(superagent.post(apiPlatformUrl +
        '/organizations/' + organizationId +
        '/apis')
      .send(JSON.stringify(makeAPI(apiName, versionName)))
      .type('application/json')
    )
    .then(function (response) {
      return {
        organizationId: organizationId,
        id: response.body.id,
        version: {
          id: response.body.version.id
        }
      };
    })
    .catch(function (err) {
      return BPromise.reject(checkUnauthorized(err));
    });

    function makeAPI(apiName, versionName) {
      return {
        name: apiName,
        version: {name: versionName}
      };
    }
  }

  function createAPIVersion(organizationId, apiId, versionName) {
    return apiClient(superagent.post(apiPlatformUrl +
        '/organizations/' + organizationId +
        '/apis/' + apiId +
        '/versions')
      .send(JSON.stringify(makeAPIVersion(versionName)))
      .type('application/json')
    )
    .then(function (response) {
      return {
        organizationId: organizationId,
        id: apiId,
        version: {
          id: response.body.id
        }
      };
    })
    .catch(function (err) {
      return BPromise.reject(checkUnauthorized(err));
    });

    function makeAPIVersion(versionName) {
      return {
        name: versionName,
        description: ''
      };
    }
  }

  function getAllAPIs(organizationId) {
    return apiClient(sort(superagent.get(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis')))
      .then(buildApisInformation)
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
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
    return new BPromise(function (resolve, reject) {
      var request = prepareApiRequest(
        superagentCallbacks.get(apiPlatformUrl +
          '/organizations/' + organizationId +
          '/apis/' + apiId +
          '/versions/' + apiVersionId +
          '/files/export'), 'application/zip');

      stream.on('finish', function () {
        resolve();
      });

      stream.on('error', function () {
        reject(new errors.WriteFileError());
      });

      request.on('error', function () {
        reject(new errors.DownloadFileError());
      });

      // workaround for https://github.com/visionmedia/superagent/issues/469
      request.on('end', function () {
        var status = this.res.statusCode;
        if (status === 200) {
          return;
        }

        return reject(checkUnauthorized({status: status},
          new errors.DownloadFileError()));
      });

      request.pipe(stream);
    });
  }

  function getAPIFilesMetadata(organizationId, apiId, apiVersionId) {
    return apiClient(superagent.get(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files'))
      .then(function (response) {
        return response.body.filter(metaFilesFilter);
      })
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
      });
  }

  function createAPIDirectory(organizationId, apiId, apiVersionId, newDir) {
    var dir = {
      name: path.basename(newDir.path),
      parentId: newDir.parentId,
      isDirectory: true,
      path: newDir.path
    };

    return createResource(organizationId, apiId, apiVersionId, dir);
  }

  function deleteAPIDirectory(organizationId, apiId, apiVersionId, deletedDir) {
    return apiClient(superagent.del(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files/' + deletedDir.id))
      .return(deletedDir.path)
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
      });
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
          audit: createdEntry.audit,
          path: newEntry.path,
          id: createdEntry.id
        };
      })
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
      });
  }

  function updateAPIFile(organizationId, apiId, apiVersionId, fileToUpdate) {
    var file = _.pick(fileToUpdate, [
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
      '/files/' + fileToUpdate.id)
      .set('Content-Type', 'application/json')
      .send(file))
      .then(function (response) {
        var updatedFile = response.body;
        return {
          audit: updatedFile.audit,
          path: fileToUpdate.path,
          id: updatedFile.id
        };
      })
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
      });
  }

  function deleteAPIFile(organizationId, apiId, apiVersionId, deletedFile) {
    return apiClient(superagent.del(apiPlatformUrl +
      '/organizations/' + organizationId +
      '/apis/' + apiId +
      '/versions/' + apiVersionId +
      '/files/' + deletedFile.id))
      .return(deletedFile.path)
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
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
          name: version.name,
          rootFileId: version.rootFileId
        });
      });

      apis.push(anApi);
    });

    return apis;
  }

  function apiClient(request) {
    return prepareApiRequest(request)
      .end();
  }

  function prepareApiRequest(request, acceptOverrideValue) {
    return request
      .set('Authorization', 'Bearer ' + contextHolder.get().getToken())
      .set('Accept', acceptOverrideValue || 'application/json');
  }

  function sort(request) {
    return request.query({sort: 'name', ascending: true});
  }

  function checkUnauthorized(error, errorToThrow) {
    if (error.status === 401) {
      return new errors.BadCredentialsError();
    } else {
      return errorToThrow ? errorToThrow : error;
    }
  }

  function metaFilesFilter(apiFile) {
    return path.extname(apiFile.name) !== '.meta';
  }
};
