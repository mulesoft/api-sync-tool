'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator  = require('../support/contentGenerator');

var workspaceRepositoryStub = {};
var errorsStub = {};

var workspace = contentGenerator.generateWorkspace();

describe('validateNoSetupDoneStrategy', run(function (validateNoSetupDoneStrategy) {
  beforeEach(function () {
    workspaceRepositoryStub.get = sinon.stub();
    errorsStub.SetupAlreadyDoneError = sinon.stub();
  });

  it('should pass validation for not initialized workspace', function (done) {
    workspaceRepositoryStub.exists =
      sinon.stub().returns(BPromise.resolve(false));

    validateNoSetupDoneStrategy()
      .then(function () {
        asserts.calledOnceWithoutParameters([workspaceRepositoryStub.exists]);
        asserts.notCalled([workspaceRepositoryStub.get]);

        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  it('should fail validation for existing workspace', function (done) {
    workspaceRepositoryStub.exists =
      sinon.stub().returns(BPromise.resolve(true));
    workspaceRepositoryStub.get.returns(BPromise.resolve(workspace));

    validateNoSetupDoneStrategy()
      .then(function () {
        done('should have failed');
      })
      .catch(function () {
        asserts.calledOnceWithoutParameters([workspaceRepositoryStub.exists]);
        asserts.calledOnceWithoutParameters([workspaceRepositoryStub.get]);
        errorsStub.SetupAlreadyDoneError.calledWithNew().should.be.true();
        errorsStub.SetupAlreadyDoneError.calledWithExactly(
          workspace.bizGroup.name,
          workspace.api.name,
          workspace.apiVersion.name
        )
        .should.be.true();

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
