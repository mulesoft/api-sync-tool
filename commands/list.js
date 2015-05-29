'use strict';

var apiFilesRepository = require('../repositories/apiFilesRepository');

module.exports = {
  execute: function () {
    return apiFilesRepository.list();
  }
};
