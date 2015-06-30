'use strict';

require('should');
var sinon = require('sinon');

var asserts  = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var loggerStub = {};
var messagesStub = {};
var localServiceStub = {};
var validateSetupStrategyStub = {};

var successfulMessage = 'Success';
var nothingMessage = 'Nothing';

describe('statusCommand', function () {
  beforeEach(function () {
    messagesStub.status = sinon.stub().returns(successfulMessage);
    messagesStub.nothingStatus = sinon.stub().returns(nothingMessage);
    localServiceStub.status = sinon.stub();
    loggerStub.info = sinon.stub();
    validateSetupStrategyStub.validate = sinon.stub();
  });

  describe('validateSetup', run(function (statusCommand) {
    it('should be a dependency', function (done) {
      validateSetupStrategyStub.should.equal(statusCommand.validateSetup);

      done();
    });
  }));

  describe('validateInput', run(function (statusCommand) {
    it('should run validation and do nothing', function (done) {
      statusCommand.validateInput()
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('execute', run(function (statusCommand) {
    it('should execute status and log changes', function (done) {
      var result = {
        added: [{
          name: 'api.raml',
          path: '/api.raml'
        }],
        changed: [],
        unchanged: [],
        deleted: []
      };
      localServiceStub.status.returns(Promise.resolve(result));

      statusCommand.execute()
        .then(function () {
          asserts.calledOnceWithoutParameters([localServiceStub.status]);
          asserts.calledOnceWithExactly(messagesStub.status, [result]);
          asserts.calledOnceWithExactly(loggerStub.info, [successfulMessage]);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should execute status and log an empty result', function (done) {
      var result = {
        added: [],
        changed: [],
        unchanged: [{
          name: 'api.raml',
          path: '/api.raml'
        }],
        deleted: []
      };
      localServiceStub.status.returns(Promise.resolve(result));

      statusCommand.execute()
        .then(function () {
          asserts.calledOnceWithoutParameters([localServiceStub.status,
            messagesStub.nothingStatus]);
          asserts.calledOnceWithExactly(loggerStub.info, [nothingMessage]);
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
    container.register('localService', localServiceStub);
    container.register('validateSetupStrategy', validateSetupStrategyStub);
    container.resolve(callback);
  };
}
