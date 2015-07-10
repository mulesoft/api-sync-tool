'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var asserts  = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var loggerStub = {};
var messagesStub = {};
var statusControllerStub = {};
var validateSetupDoneStrategyStub = {};

var successfulMessage = 'Success';
var nothingMessage = 'Nothing';

describe('statusCommand', function () {
  beforeEach(function () {
    messagesStub.statusAndConflicts = sinon.stub().returns(successfulMessage);
    messagesStub.nothingStatus = sinon.stub().returns(nothingMessage);
    messagesStub.statusDetailedHelp = sinon.stub();
    statusControllerStub.status = sinon.stub();
    statusControllerStub.conflicts = sinon.stub();
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
      var status = {
        added: [{
          name: 'api.raml',
          path: '/api.raml'
        }],
        changed: [],
        unchanged: [],
        deleted: []
      };
      var conflicts = {
        added: [{
          name: 'api.raml',
          path: '/api.raml'
        }],
        changed: [],
        unchanged: [],
        deleted: []
      };
      statusControllerStub.status.returns(BPromise.resolve(status));
      statusControllerStub.conflicts.returns(BPromise.resolve(conflicts));
      run(function (statusCommand) {
        statusCommand.execute()
          .then(function () {
            asserts.calledOnceWithoutParameters([statusControllerStub.status]);
            asserts.calledOnceWithExactly(messagesStub.statusAndConflicts,
              [status, conflicts]);
            asserts.calledOnceWithExactly(loggerStub.info, [successfulMessage]);
            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should execute status and log an empty result', function (done) {
      var status = {
        added: [],
        changed: [],
        unchanged: [{
          name: 'api.raml',
          path: '/api.raml'
        }],
        deleted: []
      };
      var conflicts = {};

      statusControllerStub.status.returns(BPromise.resolve(status));
      statusControllerStub.conflicts.returns(BPromise.resolve(conflicts));

      run(function (statusCommand) {
        statusCommand.execute()
          .then(function () {
            asserts.calledOnceWithoutParameters([statusControllerStub.status,
              statusControllerStub.conflicts, messagesStub.nothingStatus]);
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
  container.register('statusController', statusControllerStub);
  container.register('validateSetupDoneStrategy', validateSetupDoneStrategyStub);
  container.resolve(callback);
}
