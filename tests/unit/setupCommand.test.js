'use strict';

var should = require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var messagesStub = {};
var loggerStub = {};
var setupControllerStub = {};
var pullControllerStub = {};
var setupStrategyFactoryStub = {};
var errorsStub = {};

var setupControllerResult = {
  workspace: contentGenerator.generateWorkspace(),
  runPull: false
};
var files = [
  {
    id: 1,
    path: 'file.raml'
  }
];

describe('setupCommand', function () {
  var error = {error: 'error'};
  beforeEach(function () {
    errorsStub.WrongArgumentsError = sinon.stub().returns(error);

    messagesStub.interactiveDescription = sinon.stub().returns('interactive');
    messagesStub.businessGroupDescription = sinon.stub().returns('bizGroup');
    messagesStub.apiDescription = sinon.stub().returns('api');
    messagesStub.apiVersionDescription = sinon.stub().returns('apiVersion');
    messagesStub.runPullDescription = sinon.stub().returns('runPull');
    messagesStub.setupSuccessful = sinon.stub().returns('Ok');
    messagesStub.status = sinon.stub().returns('status');

    setupControllerStub.setup =
      sinon.stub().returns(Promise.resolve(setupControllerResult));
    pullControllerStub.getAPIFiles =
      sinon.stub().returns(Promise.resolve(files));
    setupStrategyFactoryStub.get = sinon.stub();
    loggerStub.info = sinon.stub();
  });

  describe('validateInput', run(function (setupCommand) {
    it('should fail when no arguments are specified', function (done) {
      setupCommand.validateInput({})
        .then(function () {
          done('Error: test should fail');
        })
        .catch(function (err) {
          errorsStub.WrongArgumentsError.called.should.be.true;
          errorsStub.WrongArgumentsError.firstCall
            .args.length.should.equal(2);
          errorsStub.WrongArgumentsError.firstCall
            .args[0].should.equal('setup');
          errorsStub.WrongArgumentsError.firstCall
            .args[1].should.be.an.Array;

          err.should.be.an.Object;
          should.deepEqual(err, error);

          messagesStub.interactiveDescription.called.should.be.true;
          messagesStub.businessGroupDescription.called.should.be.true;
          messagesStub.apiDescription.called.should.be.true;
          messagesStub.apiVersionDescription.called.should.be.true;
          messagesStub.runPullDescription.called.should.be.true;

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass when interactive argument is present', function (done) {
      setupCommand.validateInput({i: true})
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass when batch arguments are presenet', function (done) {
      setupCommand.validateInput(
        {bizGroup: 1234, api: 'name', apiVersion: 'version'})
        .then(function () {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('execute', run(function (setupCommand) {
    it('should run the command in interactive mode', function (done) {
      setupCommand.execute({i: true})
        .then(function () {
          setupControllerStub.setup.called.should.be.true;
          setupStrategyFactoryStub.get.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run the command in batch mode', function (done) {
      setupCommand.execute({bizGroup: 1234, api: 'name', apiVersion: 'version'})
        .then(function () {
          setupControllerStub.setup.called.should.be.true;
          setupStrategyFactoryStub.get.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run the command in interactive mode and call pull after it',
    function (done) {
      // Change setup controller response
      setupControllerResult.runPull = true;

      setupCommand.execute({i: true})
        .then(function () {
          setupControllerStub.setup.called.should.be.true;
          setupStrategyFactoryStub.get.called.should.be.true;
          pullControllerStub.getAPIFiles.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          messagesStub.status.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');
          loggerStub.info.secondCall.args[0].should.equal('status');

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should run the command in batch mode and call pull after it',
    function (done) {
      // Change setup controller response
      setupControllerResult.runPull = true;

      setupCommand.execute({bizGroup: 1234, api: 'name', apiVersion: 'version'})
        .then(function () {
          setupStrategyFactoryStub.get.called.should.be.true;
          setupControllerStub.setup.called.should.be.true;
          pullControllerStub.getAPIFiles.called.should.be.true;
          messagesStub.setupSuccessful.called.should.be.true;
          messagesStub.status.called.should.be.true;
          loggerStub.info.called.should.be.true;
          loggerStub.info.firstCall.args[0].should.equal('Ok');
          loggerStub.info.secondCall.args[0].should.equal('status');

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
    container.register('pullController', pullControllerStub);
    container.register('setupStrategyFactory', setupStrategyFactoryStub);
    container.resolve(callback);
  };
}
