'use strict';

var _ = require('lodash');
var should = require('should');

var containerFactory  = require('../support/testContainerFactory');

describe('contextFactory', function () {
  describe('create', run(function (contextFactory) {
    var authentication = {
      accessToken: '12345sdfsg'
    };
    var directoryPath = '/Users/test';

    it('should create a context with the specified attributes', function () {
      var context = contextFactory.create(authentication, directoryPath);
      context.should.be.an.Object();
      context.getToken().should.equal(authentication.accessToken);
      context.getDirectoryPath().should.equal(directoryPath);
      should.deepEqual(_.keys(context), ['getToken', 'getDirectoryPath']);
    });

    it('should create a context without token if no authentication is passed', function () {
      var context = contextFactory.create(null, directoryPath);
      context.should.be.an.Object();
      context.getToken().should.equal('');
      context.getDirectoryPath().should.equal(directoryPath);
      should.deepEqual(_.keys(context), ['getToken', 'getDirectoryPath']);
    });
  }));
});

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.resolve(callback);
  };
}
