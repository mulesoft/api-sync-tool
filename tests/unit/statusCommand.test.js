'use strict';

require('should');
var sinon = require('sinon');

var asserts  = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var loggerStub = {};
var messagesStub = {};
var localServiceStub = {};
var validateSetupDoneStrategyStub = {};

var successfulMessage = 'Success';
var nothingMessage = 'Nothing';

describe('statusCommand', function () {
  beforeEach(function () {
    messagesStub.status = sinon.stub().returns(successfulMessage);
    messagesStub.nothingStatus = sinon.stub().returns(nothingMessage);
    messagesStub.statusDetailedHelp = sinon.stub();
    localServiceStub.status = sinon.stub();
    loggerStub.info = sinon.stub();
    validateSetupDoneStrategyStub.validate = sinon.stub();
  });

  describe('getHelp', function () {
    it('should be a message', function (done) {
      run(function (statusCommand) {
        messagesStub.statusDetailedHelp.should.equal(statusCommand.getHelp);
        done();
      });
    });
  });

  describe('validateSetup', function () {
    it('should be a dependency', function (done) {
      run(function (statusCommand) {
        validateSetupDoneStrategyStub.should.equal(statusCommand.validateSetup);

        done();
      });
    });
  });

  describe('validateInput', function () {
    it('should run validation and do nothing', function (done) {
      run(function (statusCommand) {
        statusCommand.validateInput()
          .then(function () {
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('parseArgs', function () {
    it('should parse args and do nothing', function (done) {
      run(function (statusCommand) {
        statusCommand.parseArgs()
          .then(function () {
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('execute', function () {
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
      run(function (statusCommand) {
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
      run(function (statusCommand) {
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
    });
  });
});

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('messages', messagesStub);
  container.register('logger', loggerStub);
  container.register('localService', localServiceStub);
  container.register('validateSetupDoneStrategy', validateSetupDoneStrategyStub);
  container.resolve(callback);
}
