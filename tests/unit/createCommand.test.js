'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var createControllerStub = {};
var errorsStub = {};
var loggerStub = {};
var messagesStub = {};
var pushCommandStub = {};
var setupCommandStub = {};
var validateNoSetupDoneStrategyStub = {};
var creatingAPI = 'creating';
var settingEnvironment = 'setted';

describe('createCommand', function () {
  var error = {error: 'error'};

  beforeEach(function () {
    errorsStub.WrongArgumentsError = sinon.stub().returns(error);

    messagesStub.businessGroupDescription = sinon.stub().returns('bizGroup');
    messagesStub.apiNameDescription = sinon.stub().returns('api');
    messagesStub.apiVersionNameDescription = sinon.stub().returns('apiVersion');
    messagesStub.rootRamlDescription = sinon.stub().returns('root raml path');
    messagesStub.settingEnvironment = sinon.stub().returns(settingEnvironment);
    messagesStub.creatingAPI = sinon.stub().returns(creatingAPI);

    loggerStub.info = sinon.stub();

    validateNoSetupDoneStrategyStub.validate = sinon.stub();
  });

  describe('validateSetup', run(function (createCommand) {
    it('should be a dependency', function (done) {
      validateNoSetupDoneStrategyStub.should.equal(createCommand.validateSetup);

      done();
    });
  }));

  describe('validateInput', run(function (createCommand) {
    it('should fail when there are wrong aguments',
        function (done) {
          createCommand.validateInput({_: ['create'], bizGroup: 1234, pepe: 1})
        .then(function () {
          done('Error: test should fail');
        })
        .catch(function (err) {
          asserts.calledOnceWithExactly(
            errorsStub.WrongArgumentsError, ['create', sinon.match.array]);

          err.should.be.an.Object;
          should.deepEqual(err, error);

          asserts.calledOnceWithoutParameters([
            messagesStub.businessGroupDescription,
            messagesStub.apiNameDescription,
            messagesStub.apiVersionNameDescription,
            messagesStub.rootRamlDescription
          ]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should pass with the right arguments', function (done) {
      createCommand.validateInput({
          _: ['create'],
          bizGroup: 1234,
          api: 'name',
          apiVersion: 'version',
          rootRaml: 'api.raml'
        })
        .then(function (result) {
          should.not.exist(result);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('parseArgs', run(function (createCommand) {
    it('should parse batch mode arguments', function (done) {
      try {
        var args = createCommand.parseArgs({
          _: ['create'],
          bizGroup: 1234,
          api: 'name',
          apiVersion: 'version',
          rootRaml: 'api.raml'
        });
        should.deepEqual(args, {
          bizGroup: 1234,
          api: 'name',
          apiVersion: 'version',
          rootRamlPath: 'api.raml'
        });

        done();
      } catch (err) {
        done(err);
      }
    });
  }));

  describe('execute', run(function (createCommand) {
    it('should run the command', function (done) {
      var api = {
        organizationId: 1234,
        id: 1,
        version: {
          id: 2
        }
      };
      createControllerStub.create = sinon.stub().returns(Promise.resolve(api));
      pushCommandStub.execute = sinon.stub().returns(Promise.resolve());
      setupCommandStub.execute = sinon.stub().returns(Promise.resolve());
      var args = {
        bizGroup: 1234,
        api: 'name',
        apiVersion: 'version',
        rootRamlPath: 'api.raml'
      };
      createCommand.execute(args)
        .then(function () {
          asserts.calledOnceWithExactly(createControllerStub.create, [args]);
          asserts.calledOnceWithExactly(setupCommandStub.execute, [{
            bizGroup: api.organizationId,
            api: api.id,
            apiVersion: api.version.id
          }]);

          asserts.calledOnceWithExactly(pushCommandStub.execute, [undefined]);

          loggerStub.info.calledTwice.should.be.true();
          loggerStub.info.firstCall.calledWithExactly(creatingAPI)
            .should.be.true();
          loggerStub.info.secondCall.calledWithExactly(settingEnvironment)
            .should.be.true();

          asserts.calledOnceWithoutParameters([
            messagesStub.creatingAPI,
            messagesStub.settingEnvironment
          ]);

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
    container.register('createController', createControllerStub);
    container.register('errors', errorsStub);
    container.register('logger', loggerStub);
    container.register('messages', messagesStub);
    container.register('pushCommand', pushCommandStub);
    container.register('setupCommand', setupCommandStub);
    container.register('validateNoSetupDoneStrategy',
      validateNoSetupDoneStrategyStub);
    container.resolve(callback);
  };
}
