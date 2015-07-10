'use strict';

var BPromise = require('bluebird');

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
    messagesStub.createDetailedHelp = sinon.stub();
    messagesStub.apiNameDescription = sinon.stub().returns('api');
    messagesStub.apiDescription = sinon.stub().returns('api');
    messagesStub.apiVersionNameDescription = sinon.stub().returns('apiVersion');
    messagesStub.rootRamlDescription = sinon.stub().returns('root raml path');
    messagesStub.settingEnvironment = sinon.stub().returns(settingEnvironment);
    messagesStub.creatingAPI = sinon.stub().returns(creatingAPI);

    loggerStub.info = sinon.stub();

    validateNoSetupDoneStrategyStub.validate = sinon.stub();
  });

  describe('getHelp', function () {
    it('should be a message', function (done) {
      run(function (createCommand) {
        messagesStub.createDetailedHelp.should.equal(createCommand.getHelp);
        done();
      });
    });
  });

  describe('validateSetup', function () {
    it('should be a dependency', function (done) {
      run(function (createCommand) {
        validateNoSetupDoneStrategyStub.should.equal(createCommand.validateSetup);

        done();
      });
    });
  });

  describe('validateInput', function () {
    it('should fail when there are not enough arguments', function (done) {
      run(function (createCommand) {
        createCommand.validateInput({
          _: ['create'],
          bizGroup: 1234,
          pepe: 1
        })
        .then(function () {
          done('Error: test should fail');
        })
        .catch(function (err) {
          checkError(err);

          done();
        })
        .catch(function (err) {
          done(err);
        });
      });
    });

    it('should fail when there both API and API version arguments',
        function (done) {
      run(function (createCommand) {
        createCommand.validateInput({
          _: ['create'],
          bizGroup: 1234,
          apiId: 1,
          apiName: 'name',
          apiVersion: 'version',
          rootRaml: 'api.raml'
        })
        .catch(function (err) {
          checkError(err);

          done();
        })
        .catch(function (err) {
          done(err);
        });
      });
    });

    it('should pass with the right arguments for new API', function (done) {
      run(function (createCommand) {
        createCommand.validateInput({
          _: ['create'],
          bizGroup: 1234,
          apiId: 1,
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
    });

    it('should pass with the right arguments for new API version',
        function (done) {
      run(function (createCommand) {
        createCommand.validateInput({
          _: ['create'],
          bizGroup: 1234,
          apiName: 'name',
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
    });

    function checkError(err) {
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
    }
  });

  describe('parseArgs', function () {
    it('should parse batch mode arguments for new API', function (done) {
      run(function (createCommand) {
        try {
          var args = createCommand.parseArgs({
            _: ['create'],
            bizGroup: 1234,
            apiId: 1,
            apiVersion: 'version',
            rootRaml: 'api.raml'
          });
          should.deepEqual(args, {
            bizGroup: 1234,
            apiId: 1,
            apiName: undefined,
            apiVersion: 'version',
            rootRamlPath: 'api.raml'
          });

          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('should parse batch mode arguments for new API version',
        function (done) {
      run(function (createCommand) {
        try {
          var args = createCommand.parseArgs({
            _: ['create'],
            bizGroup: 1234,
            apiName: 'name',
            apiVersion: 'version',
            rootRaml: 'api.raml'
          });
          should.deepEqual(args, {
            bizGroup: 1234,
            apiId: undefined,
            apiName: 'name',
            apiVersion: 'version',
            rootRamlPath: 'api.raml'
          });

          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('execute', function () {
    var api = {
      organizationId: 1234,
      id: 1,
      version: {
        id: 2
      }
    };

    beforeEach(function () {
      createControllerStub.createAPI =
        sinon.stub().returns(BPromise.resolve(api));
      createControllerStub.createAPIVersion =
        sinon.stub().returns(BPromise.resolve(api));
      pushCommandStub.execute = sinon.stub().returns(BPromise.resolve());
      setupCommandStub.execute = sinon.stub().returns(BPromise.resolve());
    });

    it('should run the command for a new API', function (done) {
      var args = {
        bizGroup: 1234,
        apiName: 'name',
        apiVersion: 'version',
        rootRamlPath: 'api.raml'
      };
      run(function (createCommand) {
        createCommand.execute(args)
          .then(function () {
            asserts.calledOnceWithExactly(createControllerStub.createAPI,
              [args]);

            checkNewAPI();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    it('should run the command for a new API version', function (done) {
      var args = {
        bizGroup: 1234,
        apiId: 1,
        apiVersion: 'version',
        rootRamlPath: 'api.raml'
      };
      run(function (createCommand) {
        createCommand.execute(args)
          .then(function () {
            asserts.calledOnceWithExactly(createControllerStub.createAPIVersion,
              [args]);

            checkNewAPI();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    function checkNewAPI() {
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
    }
  });
});

function run(callback) {
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
}
