'use strict';

var BPromise = require('bluebird');

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
var validateNoSetupDoneStrategyStub = {};
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

    messagesStub.interactiveDescription = sinon.stub().returns('interactive');
    messagesStub.businessGroupDescription = sinon.stub().returns('bizGroup');
    messagesStub.apiDescription = sinon.stub().returns('api');
    messagesStub.apiVersionDescription = sinon.stub().returns('apiVersion');
    messagesStub.runPullDescription = sinon.stub().returns('runPull');
    messagesStub.setupDetailedHelp = sinon.stub();
    messagesStub.setupSuccessful = sinon.stub().returns(okMessage);

    setupControllerStub.setup = sinon.stub().returns(BPromise.resolve(
        setupControllerResult));
    pullCommandStub.execute = sinon.stub().returns(BPromise.resolve());
    setupStrategyFactoryStub.get = sinon.stub();
    loggerStub.info = sinon.stub();

    validateNoSetupDoneStrategyStub.validate = sinon.stub();

    workspaceRepositoryStub.exists = sinon.stub();
    workspaceRepositoryStub.get = sinon.stub();
  });

  describe('getHelp', function () {
    it('should be a message', function (done) {
      run(function (setupCommand) {
        messagesStub.setupDetailedHelp.should.equal(setupCommand.getHelp);
        done();
      });
    });
  });

  describe('validateSetup', function () {
    it('should be a dependency', function (done) {
      run(function (setupCommand) {
        validateNoSetupDoneStrategyStub.should.equal(setupCommand.validateSetup);

        done();
      });
    });
  });

  describe('validateInput', function () {
    it('should fail when there are arguments but not the batch mode ones',
        function (done) {
      run(function (setupCommand) {
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
    });

    it('should pass when no argument is present', function (done) {
      run(function (setupCommand) {
        setupCommand.validateInput(emptyArguments)
          .then(function (result) {
            should.not.exist(result);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should pass when batch arguments are present', function (done) {
      run(function (setupCommand) {
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
    });
  });

  describe('parseArgs', function () {
    it('should parse interactive mode arguments', function (done) {
      run(function (setupCommand) {
        try {
          should.deepEqual(setupCommand.parseArgs({_: ['setup']}),
            {isInteractive: true});

          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('should parse batch mode arguments', function (done) {
      run(function (setupCommand) {
        try {
          var args = setupCommand.parseArgs({_: ['setup'],
            bizGroup: 1234, api: 'name', apiVersion: 'version', p: true});
          should.deepEqual(args,
            {bizGroup: 1234, api: 'name', apiVersion: 'version', runPull: true});

          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('execute', function () {
    it('should parse use batch mode when there are parameters',
        function (done) {
      var args = {
        bizGroup: 1234,
        api: 'name',
        apiVersion: 'version',
        runPull: true
      };
      run(function (setupCommand) {
        setupCommand.execute(args)
          .then(function () {
            asserts.calledOnceWithExactly(setupStrategyFactoryStub.get, [args]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should use interactive mode when it\'s selected',
        function (done) {
      var args = {isInteractive: true};
      run(function (setupCommand) {
        setupCommand.execute(args)
          .then(function () {
            asserts.calledOnceWithExactly(setupStrategyFactoryStub.get, [args]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should run the command', function (done) {
      run(function (setupCommand) {
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
    });

    it('should run pull when asked', function (done) {
      // Change setup controller response
      setupControllerResult.runPull = true;
      run(function (setupCommand) {
        setupCommand.execute({_: ['setup']})
          .then(function () {
            asserts.calledOnceWithoutParameters([pullCommandStub.execute]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('shouldn\'t run pull if not asked',
    function (done) {
      // Change setup controller response
      setupControllerResult.runPull = false;
      run(function (setupCommand) {
        setupCommand.execute({_: ['setup']})
          .then(function () {
            pullCommandStub.execute.called.should.be.false();

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
  container.register('errors', errorsStub);
  container.register('messages', messagesStub);
  container.register('logger', loggerStub);
  container.register('setupController', setupControllerStub);
  container.register('pullCommand', pullCommandStub);
  container.register('setupStrategyFactory', setupStrategyFactoryStub);
  container.register('validateNoSetupDoneStrategy',
    validateNoSetupDoneStrategyStub);
  container.register('workspaceRepository', workspaceRepositoryStub);
  container.resolve(callback);
}
