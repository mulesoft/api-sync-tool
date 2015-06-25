'use strict';

var _ = require('lodash');
var path = require('path');

module.exports = function (apiPlatformRepository) {
  return {
    create: create
  };

  function create(organizationId, apiId, apiVersionId, newFilePath,
      remoteFiles) {
    var fileDir = path.parse(newFilePath).dir;
    var promise = Promise.resolve();

    if (!isRoot(fileDir)) {
      var subdirs = fileDir.split(path.sep);
      var currentPath = path.sep;
      subdirs.splice(0, 1);

      subdirs.forEach(function (subDir) {
        currentPath = currentPath + subDir;
        var existingDir = _.find(remoteFiles, 'path', currentPath);
        currentPath = currentPath + path.sep;

        if (existingDir) {
          promise = Promise.resolve(existingDir);
        } else {
          promise = promise.then(function (lastDir) {
            return apiPlatformRepository.createAPIDir(organizationId, apiId,
                apiVersionId, {
                  path: subDir,
                  parentId: lastDir ? lastDir.id : null
                });
          })
          .then(function (newDir) {
            remoteFiles.push(newDir);

            return newDir;
          });
        }
      });
    }

    return promise
      .then(function (lastDir) {
        return Promise.resolve({
          path: newFilePath,
          parentId: lastDir ? lastDir.id : null
        });
      });
  }

  /**
   * Returns true if the specified directory is the root.
   *
   * @param  {String} dir The directory path
   * @return {Boolean} True if the directory is the root.
   */
  function isRoot(dir) {
    return dir === path.sep;
  }
};
