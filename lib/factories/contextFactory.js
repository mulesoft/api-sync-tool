'use strict';

module.exports = function () {
  return {
    create: create
  };

  function create(authentication, directoryPath) {
    var accessToken = authentication ? authentication.accessToken : '';
    return createContext(accessToken, directoryPath);
  }

  function createContext(accessToken, directoryPath) {
    return {
      getToken: function () {
        return accessToken;
      },
      getDirectoryPath: function () {
        return directoryPath;
      }
    };
  }
};
