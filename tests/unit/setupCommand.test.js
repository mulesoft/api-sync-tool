'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var messagesStub = {};
var loggerStub = {};
var setupControllerStub = {};
var pullCommandStub = {};
var setupStrategyFactoryStub = {};
var errorsStub = {};
var workspaceRepositoryStub = {};

var emptyArguments = {_: ['setup']};

var currentWorkspace = contentGenerator.generateWorkspace();

var setupControllerResult = {
  workspace: currentWorkspace,
  runPull: false
};

describe('setupCommand', function () {
  var error = {error: 'error'};
  var okMessage = 'Ok';

  beforeEach(function () {
    errorsStub.WrongArgumentsError = sinon.stub().returns(error);
    errorsStub.SetupAlreadyDoneError = sinon.stub();

    messagesStub.interactiveDescription = sinon.stub().returns('interactive');
    messagesStub.businessGroupDescription = sinon.stub().returns('bizGroup');
    messagesStub.apiDescription = sinon.stub().returns('api');
    messagesStub.apiVersionDescription = sinon.stub().returns('apiVersion');
    messagesStub.runPullDescription = sinon.stub().returns('runPull');
    messagesStub.setupSuccessful = sinon.stub().returns(okMessage);

    setupControllerStub.setup = sinon.stub().returns(Promise.resolve(
        setupControllerResult));
    pullCommandStub.execute = sinon.stub().returns(Promise.resolve());
    setupStrategyFactoryStub.get = sinon.stub();
    loggerStub.info = sinon.stub();

    workspaceRepositoryStub.exists = sinon.stub();
    workspaceRepositoryStub.get = sinon.stub();
  });

  describe('validateSetup', run(function (setupCommand) {
    it('should pass if setup does not exist', function (done) {
      workspaceRepositoryStub.exists.returns(Promise.resolve(false));

      setupCommand.validateSetup()
        .then(function () {
          asserts.calledOnceWithoutParameters([workspaceRepositoryStub.exists]);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should fail if setup exists', function (done) {
      workspaceRepositoryStub.exists.returns(Promise.resolve(true));
      workspaceRepositoryStub.get.returns(Promise.resolve(currentWorkspace));

      setupCommand.validateSetup()
        .then(function () {
          done('Test should have failed');
        })
        .catch(function () {
          asserts.calledOnceWithoutParameters([workspaceRepositoryStub.exists,
            workspaceRepositoryStub.get]);

            errorsStub.SetupAlreadyDoneError.calledWithNew().should.be.true();

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('validateInput', run(function (setupCommand) {
    it('should fail when there are arguments but not the batch mode ones',
        function (done) {
      setupCommand.validateInput({_: ['setup'], bizGroup: 1234, pepe: 1})
        .then(function () {
          done('Error: test should fail');
        })
        .catch(function (err) {
          asserts.calledOnceWithExactly(
            errorsStub.WrongArgumentsError, ['setup', sinon.match.array]);

          err.should.be.an.Object();
          should.deepEqual(err, error);

          asserts.calledOnceWithoutParameters([
            messagesStub.businessGroupDescription,
            messagesStub.apiDescription,
            messagesStub.apiVersionDescription,
            messagesStub.runPullDescription
          ]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass when no argument is present', function (done) {
      setupCommand.validateInput(emptyArguments)
        .then(function (result) {
          should.not.exist(result);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass when batch arguments are presenet', function (done) {
      setupCommand.validateInput(
        {_: ['setup'], bizGroup: 1234, api: 'name', apiVersion: 'version'})
        .then(function (result) {
          should.not.exist(result);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('execute', run(function (setupCommand) {
    it('should use interactive mode when there are no parameters',
        function (done) {
      setupCommand.execute({_: ['setup'],
          bizGroup: 1234, api: 'name', apiVersion: 'version', p: true})
        .then(function () {
          asserts.calledOnceWithExactly(setupStrategyFactoryStub.get, [{
            bizGroup: 1234,
            api: 'name',
            apiVersion: 'version',
            runPull: true}]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should parse use batch mode when there are parameters',
        function (done) {
      setupCommand.execute({_: ['setup']})
        .then(function () {
          asserts.calledOnceWithExactly(setupStrategyFactoryStub.get,
            [{isInteractive: true}]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run the command', function (done) {
      setupCommand.execute({_: ['setup']})
        .then(function () {
          setupControllerStub.setup.calledOnce.should.be.true();

          asserts.calledOnceWithExactly(messagesStub.setupSuccessful,
            [setupControllerResult.workspace]);
          asserts.calledOnceWithExactly(loggerStub.info, [okMessage]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run pull when asked',
    function (done) {
      // Change setup controller response
      setupControllerResult.runPull = true;

      setupCommand.execute({_: ['setup']})
        .then(function () {
          asserts.calledOnceWithoutParameters([pullCommandStub.execute]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('shouldn\'t run pull if not asked',
    function (done) {
      // Change setup controller response
      setupControllerResult.runPull = false;

      setupCommand.execute({_: ['setup']})
        .then(function () {
          pullCommandStub.execute.called.should.be.false();

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
    container.register('errors', errorsStub);
    container.register('messages', messagesStub);
    container.register('logger', loggerStub);
    container.register('setupController', setupControllerStub);
    container.register('pullCommand', pullCommandStub);
    container.register('setupStrategyFactory', setupStrategyFactoryStub);
    container.register('workspaceRepository', workspaceRepositoryStub);
    container.resolve(callback);
  };
}
