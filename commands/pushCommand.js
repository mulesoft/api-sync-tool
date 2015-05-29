'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sha = require('sha');

module.exports = function () {
  return {
    execute: push
  };

  function push(args) {
    return Promise.reject('Implement me');
  }
};
