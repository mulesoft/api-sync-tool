'use strict';

module.exports = function (workspaceRepository) {
  return {
    create: create
  };

  function create(authentication, directoryPath) {
    var accessToken;
    if (!authentication) {
      var workspace = workspaceRepository.get();
      accessToken = workspace && workspace.authentication && workspace.authentication.access_token;
    } else {
      accessToken = authentication.access_token;
    }

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
