'use strict';

var path = require('path');
var _ = require('lodash');

module.exports = function (BPromise, contextHolder, fs, sha) {
  return {
    getDirectoriesPath: getDirectoriesPath,
    getFile: getFile,
    getFileFullPath: getFileFullPath,
    getFileHash: getFileHash,
    getFilesPath: getFilesPath,
    createWriteStream: createWriteStream,
    removeFile: removeFile
  };

  function getFile(filePath) {
    return fs.readFile(getFileFullPath(filePath), 'utf8')
      .then(function (data) {
        return {
          path: filePath,
          data: data
        };
      });
  }

  function getFileFullPath(fileLocalPath) {
    return path.join(contextHolder.get().getDirectoryPath(), fileLocalPath);
  }

  function getFileHash(localFilePath) {
    return sha.get(getFileFullPath(localFilePath));
  }

  /**
   * Returns the relative paths of all directories descending from a directory
   * in the local repository. If no directory is provided it uses the root
   * of the local repository.
   *
   * @param {String} directory The directory whom all descendants will
   * be returned
   */
  function getDirectoriesPath(directory) {
    return getDirectoryDirectoriesPath(directory || '');
  }

  /**
   * Returns the relative paths of all files descending from a directory
   * in the local repository. If no directory is provided it uses the root
   * of the local repository.
   *
   * @param {String} directory The directory whom all descendants will
   * be returned
   */
  function getFilesPath(directory) {
    return getDirectoryFilesPath(directory || '');
  }

  function createWriteStream(localFilePath) {
    return fs.createWriteStream(getFileFullPath(localFilePath));
  }

  function removeFile(fileLocalPath) {
    return fs.unlink(getFileFullPath(fileLocalPath));
  }

  /**
   * Returns the relative paths of all directories descending from a directory
   * in the local repository
   *
   * @param {String} directory The directory whom all descendants will
   * be returned
   */
  function getDirectoryDirectoriesPath(directory) {
    return doWithDirectoryContent(directory, doWithFile, doWithDirectory);

    function doWithFile() {
      return BPromise.resolve([]);
    }

    function doWithDirectory(fullLocalFilePath) {
      return getDirectoryDirectoriesPath(fullLocalFilePath)
        .then(function (directories) {
          directories.push(fullLocalFilePath);
          return directories;
        });
    }
  }

  /**
   * Returns the relative paths of all files descending from a directory
   * in the local repository
   *
   * @param {String} directory The directory whom all descendants will
   * be returned
   */
  function getDirectoryFilesPath(directory) {
    return doWithDirectoryContent(directory, doWithFile, doWithDirectory);

    function doWithFile(fullLocalFilePath) {
      return BPromise.resolve(fullLocalFilePath);
    }

    function doWithDirectory(fullLocalFilePath) {
      return getDirectoryFilesPath(fullLocalFilePath);
    }
  }

  /**
   * Looks at a local filesystem directory and uses a function for each file
   * and another for each directory
   *
   * @param {String} directory The directory to look at
   * @param {Function} doWithFile What to do with files
   * @param {Function} doWithDirectory What to do with directories
   */
  function doWithDirectoryContent(directory,
      doWithFile, doWithDirectory) {
    return fs.readdir(getFileFullPath(directory))
      .then(function (filePaths) {
        return filePaths
          .filter(combineFilters([dotFilesFilter, metaFilesFilter]))
          .map(function (filePath) {
            var fullLocalFilePath = directory + '/' + filePath;
            return fs.stat(getFileFullPath(fullLocalFilePath))
              .then(function (stats) {
                if (stats.isDirectory()) {
                  return doWithDirectory(fullLocalFilePath);
                } else {
                  return doWithFile(fullLocalFilePath);
                }
              });
        });
      })
      .then(BPromise.all)
      .then(_.flatten);
  }

  /**
   * Filters files which basenames start with a dot (ex: .git).
   * @param  {String} filePath The full path of the file to check.
   * @return {Boolean} True if the filename does not start with a dot.
   */
  function dotFilesFilter(filePath) {
    return path.basename(filePath)[0] !== '.';
  }

  /**
   * Filters files with extension equal to 'meta'.
   * @param  {String} filePath The full path of the file to check.
   * @return {Boolean} True if the filename does not have 'meta' as extension.
   */
  function metaFilesFilter(filePath) {
    return path.extname(filePath) !== '.meta';
  }

  /**
   * Returns a new filter that combines the specified ones.
   * @param  {Array} filters The filters to apply.
   * @return {Boolean} True if all filters return true, false if any filter
   * returns false.
   */
  function combineFilters(filters) {
    return function (input) {
      return filters.every(function (filter) {
        return filter(input);
      });
    };
  }
};
