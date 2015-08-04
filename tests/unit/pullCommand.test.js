'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var asserts  = require('../support/asserts');

var loggerStub = {};
var messagesStub = {};
var pullControllerStub = {};
var validateSetupDoneStrategyStub = {};

var statusMessage = 'status';
var emptyMessage = 'empty';

var results = {
  files: [
    {
      path: '/xapi.raml',
      hash: 'asd1231das'
    },
    {
      path: '/api.raml',
      hash: 'asdasdf'
    }
  ],
  directories: [
    {
      path: '/folder2'
    },
    {
      path: '/folder1'
    }
  ]
};

describe('pullCommand', function () {
  beforeEach(function () {
    pullControllerStub.getAPIFiles = sinon.stub();
    messagesStub.status = sinon.stub().returns(statusMessage);
    messagesStub.emptyAPIPullmessage = sinon.stub().returns(emptyMessage);
    messagesStub.pullDetailedHelp = sinon.stub();
    loggerStub.info = sinon.stub();
    validateSetupDoneStrategyStub.validate = sinon.stub();
  });

  describe('getHelp', function () {
    it('should be a message', function (done) {
      run(function (pullCommand) {
        messagesStub.pullDetailedHelp.should.equal(pullCommand.getHelp);
        done();
      });
    });
  });

  describe('validateSetup', function () {
    it('should be a dependency', function (done) {
      run(function (pullCommand) {
        validateSetupDoneStrategyStub.should.equal(pullCommand.validateSetup);

        done();
      });
    });
  });

  describe('validateInput', function () {
    it('should run validation and do nothing', function (done) {
      run(function (pullCommand) {
        pullCommand.validateInput()
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
      run(function (pullCommand) {
        pullCommand.parseArgs()
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
    it('should execute pull and log the added files', function (done) {
      pullControllerStub.getAPIFiles.returns(BPromise.resolve(results));

      run(function (pullCommand) {
        pullCommand.execute()
          .then(function () {
            asserts.calledOnceWithoutParameters([pullControllerStub.getAPIFiles]);
            asserts.calledOnceWithExactly(messagesStub.status,
              [{
                addedDirectories: [
                  results.directories[1].path,
                  results.directories[0].path
                ],
                added: [
                  results.files[1].path,
                  results.files[0].path
                ]
              }]);

            asserts.calledOnceWithExactly(loggerStub.info, [statusMessage]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should execute pull and log if no files where found', function (done) {
      pullControllerStub.getAPIFiles.returns(BPromise.resolve([]));

      run(function (pullCommand) {
        pullCommand.execute()
          .then(function () {
            asserts.calledOnceWithoutParameters([pullControllerStub.getAPIFiles,
              messagesStub.emptyAPIPullmessage]);

            asserts.calledOnceWithExactly(loggerStub.info, [emptyMessage]);

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
  container.register('pullController', pullControllerStub);
  container.register('validateSetupDoneStrategy', validateSetupDoneStrategyStub);
  container.resolve(callback);
}
