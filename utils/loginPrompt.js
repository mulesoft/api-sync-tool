'use strict';

var inquirer = require('inquirer');

module.exports = function (logger) {
  return {
    getUserCredentials: getUserCredentials
  };

  function getUserCredentials() {
    return new Promise(function (resolve) {
      logger.info('Enter your APIPlatform username and password');
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
