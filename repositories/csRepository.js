'use strict';

var csLoginUrl = 'https://anypoint.mulesoft.com/accounts/oauth2/token';

module.exports = function (superagent, messages) {
  return {
    login: function (username, password) {
      var loginInformation = {
        grant_type: 'password',
        username: username,
        password: password,
        client_id: 'studio',
        client_secret: 'studio123'
      };

      return superagent.post(csLoginUrl)
        .send(loginInformation)
        .set('Accept', 'application/json')
        .end()
        .then(function (response) {
          return response.body;
        })
        .catch(function (err) {
          throw new Error(err);
        });
    }
  };
};
