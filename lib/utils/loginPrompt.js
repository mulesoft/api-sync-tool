'use strict';

module.exports = function (inquirer, logger, messages) {
  return {
    getUserCredentials: getUserCredentials
  };

  function getUserCredentials() {
    return new Promise(function (resolve) {
      logger.info(messages.loginPromptMessage());
      inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Username: '
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password: '
      }], function (answer) {
        return resolve(answer);
      });
    });
  }
};
