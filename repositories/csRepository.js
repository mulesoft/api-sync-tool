'use strict';

var csLoginUrl = 'https://anypoint.mulesoft.com/accounts/';
var loginEndpoint = 'oauth2/token';
var userInfoEndpoint = 'api/users/me';

module.exports = function (contextHolder, superagent, errors) {
  return {
    login: login,
    getUserInfo: getUserInfo
  };

  function login(username, password) {
    var loginInformation = {
      grant_type: 'password',
      username: username,
      password: password,
      client_id: 'studio',
      client_secret: 'studio123'
    };

    return superagent.post(csLoginUrl + loginEndpoint)
      .send(loginInformation)
      .set('Accept', 'application/json')
      .end()
      .then(function (response) {
        return response.body;
      })
      .catch(function (err) {
        // If the error is a credentials issue
        if (err.status === 400) {
          // return a login error
          return Promise.reject(new errors.LoginError(username));
        } else {
          // else, pass the error
          return Promise.reject(err);
        }
      });
  }

  function getUserInfo() {
    return superagent.get(csLoginUrl + userInfoEndpoint)
      .set('Authorization', 'Bearer ' + contextHolder.get().getToken())
      .end()
      .then(function (response) {
        return response.body;
      });
  }
};
