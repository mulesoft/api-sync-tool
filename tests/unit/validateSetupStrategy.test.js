'use strict';

require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator  = require('../support/contentGenerator');

var workspaceRepositoryStub = {};
var errorsStub = {};

var workspace = contentGenerator.generateWorkspace();

describe('validateSetupStrategy', run(function (validateSetupStrategy) {
  beforeEach(function () {
    workspaceRepositoryStub.get = sinon.stub();
    errorsStub.SetupNeededError = sinon.stub();
  });

  it('should pass validation for initialized workspace', function (done) {
    workspaceRepositoryStub.get.returns(Promise.resolve(workspace));

    validateSetupStrategy()
      .then(function () {
        asserts.calledOnceWithoutParameters([workspaceRepositoryStub.get]);

        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  it('should fail validation for new workspace', function (done) {
    workspaceRepositoryStub.get.returns(Promise.resolve({}));

    validateSetupStrategy()
      .then(function () {
        done('should have failed');
      })
      .catch(function () {
        asserts.calledOnceWithoutParameters([workspaceRepositoryStub.get]);

        errorsStub.SetupNeededError.calledWithNew().should.be.true();

        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
}));

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.register('errors', errorsStub);
    container.resolve(callback);
  };
}
