'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var commandsArray = [];
var containerStub = {};
var loggerStub = {};
var errorsStub = {};
var commandStub = {};

describe('commandFactory', function () {
  var commandName = 'commandName';
  var unknownCommandName = 'unknown';

  beforeEach(function () {
    commandsArray.push(commandName);

    containerStub.get = sinon.stub();
    loggerStub.debug = sinon.stub();
    errorsStub.NoParametersError = sinon.stub();
    errorsStub.UnknownCommandError = sinon.stub();
  });

  describe('get', run(function (commandFactory) {
    it('should return command if it exists', function (done) {
      containerStub.get.returns(commandStub);
      commandFactory.get({_: [commandName]})
        .then(function (command) {
          asserts.calledOnceWithExactly(containerStub.get,
            [sinon.match(commandName)]);
          asserts.calledOnceWithExactly(loggerStub.debug,
            [sinon.match(commandName)]);
          should.deepEqual(command, commandStub);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if no command name is specified', function (done) {
      containerStub.get.returns(commandStub);
      commandFactory.get({_: []})
        .then(function () {
          done('should have failed!');
        })
        .catch(function () {
          errorsStub.NoParametersError.calledWithNew().should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if command name is not found', function (done) {
      containerStub.get.returns(commandStub);
      commandFactory.get({_: [unknownCommandName]})
        .then(function () {
          done('should have failed!');
        })
        .catch(function () {
          errorsStub.UnknownCommandError.calledWithNew().should.be.true();
          errorsStub.UnknownCommandError.calledWithExactly(unknownCommandName +
            'Command');

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
    container.register('commands', commandsArray);
    container.register('container', containerStub);
    container.register('logger', loggerStub);
    container.register('errors', errorsStub);
    container.resolve(callback);
  };
}
