'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var asserts  = require('../support/asserts');

var cleanupControllerStub = {};
var loggerStub = {};
var messagesStub = {};
var validateSetupStrategyStub = {};

var successfulMessage = 'Success';

describe('cleanupCommand', function () {
  beforeEach(function () {
    cleanupControllerStub.cleanup = sinon.stub().returns(Promise.resolve());
    messagesStub.cleanup = sinon.stub().returns(successfulMessage);
    loggerStub.info = sinon.stub();
    validateSetupStrategyStub.validate = sinon.stub();
  });

  describe('validateSetup', run(function (cleanupCommand) {
    it('should be a dependency', function (done) {
      validateSetupStrategyStub.should.equal(cleanupCommand.validateSetup);

      done();
    });
  }));

  describe('execute', run(function (cleanupCommand) {
    it('should run validation and do nothing', function (done) {
      cleanupCommand.validateInput()
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should execute cleanup and log a successful result', function (done) {
      cleanupCommand.execute()
        .then(function () {
          asserts.calledOnceWithoutParameters([cleanupControllerStub.cleanup,
            messagesStub.cleanup]);

          asserts.calledOnceWithExactly(loggerStub.info, [successfulMessage]);

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
    container.register('messages', messagesStub);
    container.register('logger', loggerStub);
    container.register('cleanupController', cleanupControllerStub);
    container.register('validateSetupStrategy', validateSetupStrategyStub);
    container.resolve(callback);
  };
}
