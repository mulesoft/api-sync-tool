'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var asserts  = require('../support/asserts');

var authenticationRepositoryStub = {};
var workspaceRepositoryStub = {};

describe('cleanupController', function () {
  beforeEach(function () {
    authenticationRepositoryStub.del = sinon.stub().returns(Promise.resolve());
    workspaceRepositoryStub.del = sinon.stub().returns(Promise.resolve());
  });

  describe('cleanup', run(function (cleanupController) {
    it('should run cleanup and do nothing', function (done) {
      cleanupController.cleanup()
        .then(function () {
          asserts.calledOnceWithoutParameters([authenticationRepositoryStub.del,
            workspaceRepositoryStub.del]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));
});

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('authenticationRepository',
      authenticationRepositoryStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.resolve(callback);
  };
}
