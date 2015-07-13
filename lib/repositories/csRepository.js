'use strict';

var csLoginUrl = 'https://anypoint.mulesoft.com/accounts/';
var loginEndpoint = 'oauth2/token';
var userInfoEndpoint = 'api/users/me';

module.exports = function (BPromise, contextHolder, superagent, errors) {
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
        return {
          accessToken: response.body.access_token
        };
      })
      .catch(function (err) {
        return BPromise.reject(checkCredentials(err));
      });

      function checkCredentials(err) {
        if (err.status === 400) {
          return new errors.LoginError(username);
        } else {
          return err;
        }
      }
  }

  function getUserInfo() {
    return superagent.get(csLoginUrl + userInfoEndpoint)
      .set('Authorization', 'Bearer ' + contextHolder.get().getToken())
      .end()
      .then(function (response) {
        return response.body;
      })
      .catch(function (err) {
        return BPromise.reject(checkUnauthorized(err));
      });
  }

  function checkUnauthorized(error) {
    if (error.status === 401) {
      return new errors.BadCredentialsError();
    } else {
      return error;
    }
  }
};
