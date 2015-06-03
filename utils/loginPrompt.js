'use strict';

var inquirer = require('inquirer');

module.exports = function () {
  return {
    getUserCredentials: getUserCredentials
  };

  function getUserCredentials() {
    return new Promise(function (resolve) {
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
