'use strict';

module.exports = function (workspaceRepository) {
  return {
    create: create
  };

  function create(authentication) {
    var accessToken;
    if (!authentication) {
      var workspace = workspaceRepository.get();
      accessToken = workspace && workspace.authentication && workspace.authentication.access_token;
    } else {
      accessToken = authentication.access_token;
    }

    return createContext(accessToken);
  }

  function createContext(accessToken) {
    return {
      getToken: function () {
        return accessToken;
      }
    };
  }
};
