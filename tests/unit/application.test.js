'use strict';

require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var commandFactoryStub = {};
var commandRunnerStub = {};
var commandsStub = {};
var loggerStub = {};
var omeletteReturnsStub = {};
var omeletteStub = {};
var processStub = {};
var commandStub = {};
var helpMessage = 'help';
var errorMessage = 'error';

describe('application', function () {
  beforeEach(function () {
    commandStub = sinon.stub();
    commandStub.getHelp = sinon.stub().returns(helpMessage);
    commandFactoryStub.get = sinon.stub().returns(Promise.resolve(commandStub));

    commandRunnerStub.run = sinon.stub();

    commandsStub = sinon.stub();

    loggerStub.error = sinon.stub();
    loggerStub.debug = sinon.stub();
    loggerStub.info = sinon.stub();
    loggerStub.onComplete = sinon.stub();
    loggerStub.onComplete.onFirstCall().callsArg(1);

    omeletteReturnsStub.on = sinon.stub();
    omeletteReturnsStub.on.onFirstCall().callsArgOn(1, omeletteReturnsStub);
    omeletteReturnsStub.init = sinon.stub();
    omeletteReturnsStub.reply = sinon.stub();

    omeletteStub = sinon.stub().returns(omeletteReturnsStub);

    processStub.exit = sinon.stub();
  });

  describe('run', function () {
    it('should run the command', function (done) {
      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            assertSetup(args);
            asserts.calledOnceWithExactly(commandRunnerStub.run, [
              commandStub,
              args
            ]);

            asserts.notCalled([loggerStub.info]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should print help message when asked', function (done) {
      var args = {_: ['test'], help: true};
      run(function (application) {
        application.run(args)
          .then(function () {
            assertSetup(args);

            asserts.calledOnceWithExactly(loggerStub.info, [
              helpMessage
            ]);

            asserts.calledOnceWithoutParameters([
              commandStub.getHelp
            ]);

            asserts.notCalled([commandRunnerStub.run]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should catch errors from commandFactory', function (done) {
      commandFactoryStub.get =
        sinon.stub().returns(Promise.reject(errorMessage));

      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            assertSetup(args);
            err.should.equal(errorMessage);

            asserts.notCalled([
              loggerStub.info
            ]);

            assertsErrors();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should catch errors from commandRunner', function (done) {
      commandRunnerStub.run =
        sinon.stub().returns(Promise.reject(errorMessage));

      var args = {_: ['test']};
      run(function (application) {
        application.run(args)
          .then(function () {
            done('should fail');
          })
          .catch(function (err) {
            assertSetup(args);
            err.should.equal(errorMessage);

            asserts.calledOnceWithExactly(commandRunnerStub.run, [
              commandStub,
              args
            ]);

            asserts.notCalled([
              loggerStub.info
            ]);

            assertsErrors();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });
});

function assertSetup(args) {
  asserts.calledOnceWithExactly(omeletteStub, ['api-sync <command>']);
  asserts.calledOnceWithoutParameters([omeletteReturnsStub.init]);
  asserts.calledOnceWithExactly(omeletteReturnsStub.on, [
    'command',
    sinon.match.func
  ]);
  asserts.calledOnceWithExactly(omeletteReturnsStub.reply, [commandsStub]);

  asserts.calledOnceWithExactly(commandFactoryStub.get, [
    args
  ]);
}

function assertsErrors() {
  asserts.calledOnceWithExactly(loggerStub.error, [errorMessage]);
  asserts.calledOnceWithExactly(loggerStub.onComplete, [
    errorMessage,
    sinon.match.func
  ]);
  asserts.calledOnceWithExactly(processStub.exit, [1]);
}

function run(callback) {
  var container = containerFactory.createContainer();
  container.register('commandFactory', commandFactoryStub);
  container.register('commandRunner', commandRunnerStub);
  container.register('commands', function () {
    return commandsStub;
  });
  container.register('logger', loggerStub);
  container.register('omelette', function () {
    return omeletteStub;
  });
  container.register('process', processStub);
  container.resolve(callback);
}
