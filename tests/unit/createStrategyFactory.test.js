'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');
var _ = require('lodash');

var asserts = require('../support/asserts');
var containerFactory = require('../support/testContainerFactory');
var contentGenerator = require('../support/contentGenerator');

var commandPromptStub = {};
var errorsStub = {};
var interactiveErrorsStub = {};
var loggerStub = {};
var messagesStub = {};

var businessGroups = contentGenerator.generateBusinessGroups();
var apis = contentGenerator.generateApis();
apis[0].name = '10';
apis[0].versions[0].name = '10';

var apiDescription = 'api';
var businessGroupDescription = 'business group';
var businessGroupPromptMessage = 'Select bizGroup';
var apiPromptMessage = 'Select API';
var chooseNewAPIorNewVersionMessage = 'new API or new Version?';
var apiNamePromptMessage = 'input API name';
var repeatedAPINameMessage = 'repetead API name';
var emptyFieldError = 'emptyField';
var apiVersionNamePromptMessage = 'input API version name';
var repeatedAPIVersionNameMessage = 'repeated API version name';
var rootRamlPathPromptMessage = 'select the root RAML path';
var rootRamlDescription = 'root RAML path';

describe('createStrategyFactory', function () {
  var strategy;
  beforeEach(function () {
    commandPromptStub.getChoice = sinon.stub();
    commandPromptStub.getConfirmation = sinon.stub();
    commandPromptStub.getInput = sinon.stub();
    commandPromptStub.getRawChoice = sinon.stub();

    errorsStub.EmptyFieldError = sinon.stub();
    errorsStub.RepeatedAPINameError = sinon.stub();
    errorsStub.RepeatedAPIVersionNameError = sinon.stub();

    interactiveErrorsStub.EmptyFieldError = function () {
      this.message = emptyFieldError;
    };
    interactiveErrorsStub.RepeatedAPINameError = function () {
      this.message = repeatedAPINameMessage;
    };
    interactiveErrorsStub.RepeatedAPIVersionNameError = function () {
      this.message = repeatedAPIVersionNameMessage;
    };

    loggerStub.info = sinon.stub();

    messagesStub.apiDescription =
      sinon.stub().returns(apiDescription);
    messagesStub.apiPromptMessage =
      sinon.stub().returns(apiPromptMessage);
    messagesStub.businessGroupDescription =
      sinon.stub().returns(businessGroupDescription);
    messagesStub.businessGroupPromptMessage =
      sinon.stub().returns(businessGroupPromptMessage);
    messagesStub.createAPIPromptMessage =
      sinon.stub().returns(chooseNewAPIorNewVersionMessage);
    messagesStub.apiNamePromptMessage =
      sinon.stub().returns(apiNamePromptMessage);
    messagesStub.apiVersionNamePromptMessage =
      sinon.stub().returns(apiVersionNamePromptMessage);
    messagesStub.rootRamlDescription =
      sinon.stub().returns(rootRamlDescription);
    messagesStub.rootRamlPathPromptMessage =
      sinon.stub().returns(rootRamlPathPromptMessage);
  });

  describe('interactive', function () {
    var interactiveParameters = {
      isInteractive: true
    };
    beforeEach(function () {
      strategy = getStrategy(interactiveParameters);
    });

    describe('getCreateAPIorAPIVersionChoice', function () {
      var newApi = true;
      var choices = [
        {
          text: 'API',
          value: true
        },
        {
          text: 'API Version',
          value: false
        }
      ];

      beforeEach(function () {
        commandPromptStub.getChoice.returns(BPromise.resolve({value: newApi}));
      });

      it('should return whether the user wants to make a new API', function (done) {
        strategy.getCreateAPIorAPIVersionChoice()
          .then(function (userChoice) {
            userChoice.should.equal(newApi);

            asserts.calledOnceWithExactly(commandPromptStub.getChoice, [
              chooseNewAPIorNewVersionMessage, 'text', 'value', choices
            ]);
            asserts.calledOnceWithoutParameters([
              messagesStub.createAPIPromptMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('getBusinessGroup', function () {
      beforeEach(function () {
        commandPromptStub.getChoice.returns(BPromise.resolve(businessGroups[0]));
      });

      it('should return selected business group', function (done) {
        strategy.getBusinessGroup(businessGroups)
          .then(function (selectedBusinessGroup) {
            selectedBusinessGroup.should.be.an.Object();
            selectedBusinessGroup.id.should.be.equal(1);
            asserts.calledOnceWithExactly(commandPromptStub.getChoice, [
              businessGroupPromptMessage,
              'name', 'id', sortByName(businessGroups)
            ]);
            asserts.calledOnceWithoutParameters([
              messagesStub.businessGroupPromptMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('getAPI', function () {
      beforeEach(function () {
        commandPromptStub.getChoice.returns(BPromise.resolve(apis[0]));
      });

      it('should return selected api', function (done) {
        strategy.getAPI(apis)
          .then(function (selectedAPI) {
            selectedAPI.should.be.an.Object();
            selectedAPI.id.should.be.equal(1);

            asserts.calledOnceWithExactly(commandPromptStub.getChoice, [
              apiPromptMessage,
              'name', 'id', sortByName(apis)
            ]);
            asserts.calledOnceWithoutParameters([
              messagesStub.apiPromptMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });

    describe('getAPIName', function () {
      var apiName = 'newVersion';
      var usedApiName = apis[0].name;
      beforeEach(function () {
        commandPromptStub.getInput.returns(BPromise.resolve(apiName));
        strategy = getStrategyForErrorCases(interactiveParameters);
      });

      it('should return entered API name', function (done) {
        strategy.getAPIName(apis)
          .then(function (userApiName) {
            userApiName.should.equal(apiName);

            asserts.calledOnceWithExactly(commandPromptStub.getInput, [
              apiNamePromptMessage
            ]);
            asserts.calledOnceWithoutParameters([
              messagesStub.apiNamePromptMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      it('should ask again when API name is used', function (done) {
        var numberUsedApiName = parseInt(usedApiName);
        commandPromptStub.getInput.onFirstCall()
          .returns(BPromise.resolve(numberUsedApiName));
        commandPromptStub.getInput.onSecondCall()
          .returns(BPromise.resolve(numberUsedApiName));
        commandPromptStub.getInput.onThirdCall()
          .returns(BPromise.resolve(apiName));

        strategy.getAPIName(apis)
          .then(function (userApiName) {
            userApiName.should.equal(apiName);

            commandPromptStub.getInput.calledThrice.should.be.true();
            commandPromptStub.getInput
              .calledWithExactly(apiNamePromptMessage).should.be.true();

            calledXTimesWithoutParameters(
              messagesStub.apiNamePromptMessage, 3);

            loggerStub.info.calledTwice.should.be.true();
            loggerStub.info
              .alwaysCalledWithExactly(repeatedAPINameMessage).should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      it('should ask again when API name is blank', function (done) {
        var emptyName = ' ';
        commandPromptStub.getInput.onFirstCall()
          .returns(BPromise.resolve(emptyName));
        commandPromptStub.getInput.onSecondCall()
          .returns(BPromise.resolve(emptyName));
        commandPromptStub.getInput.onThirdCall()
          .returns(BPromise.resolve(apiName));

        strategy.getAPIName(apis)
          .then(function (userApiName) {
            userApiName.should.equal(apiName);

            commandPromptStub.getInput.calledThrice.should.be.true();
            commandPromptStub.getInput
              .calledWithExactly(apiNamePromptMessage).should.be.true();

            calledXTimesWithoutParameters(
              messagesStub.apiNamePromptMessage, 3);

            loggerStub.info.calledTwice.should.be.true();
            loggerStub.info
              .alwaysCalledWithExactly(emptyFieldError).should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      describe('errors', function () {
        var error = 'error';
        beforeEach(function () {
          commandPromptStub.getInput.returns(BPromise.reject(error));
        });

        it('should rethrow errors', function (done) {
          strategy.getAPIName(apis)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              err.should.equal(error);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getAPIVersionName', function () {
      var apiVersionName = 'newVersion';
      var usedApi = apis[0];
      var userApiVersion = usedApi.versions[0];
      var usedApiVersionName = userApiVersion.name;
      beforeEach(function () {
        commandPromptStub.getInput.returns(BPromise.resolve(apiVersionName));
        strategy = getStrategyForErrorCases(interactiveParameters);
      });

      it('should return entered API version name', function (done) {
        strategy.getAPIVersionName(apis, apis[0].id)
          .then(function (userApiVersionName) {
            userApiVersionName.should.equal(apiVersionName);

            asserts.calledOnceWithExactly(commandPromptStub.getInput, [
              apiVersionNamePromptMessage
            ]);
            asserts.calledOnceWithoutParameters([
              messagesStub.apiVersionNamePromptMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      it('should ask again when API version name is used', function (done) {
        var numberUsedApiVersionName = parseInt(usedApiVersionName);
        commandPromptStub.getInput.onFirstCall()
          .returns(BPromise.resolve(numberUsedApiVersionName));
        commandPromptStub.getInput.onSecondCall()
          .returns(BPromise.resolve(numberUsedApiVersionName));
        commandPromptStub.getInput.onThirdCall()
          .returns(BPromise.resolve(apiVersionName));

        strategy.getAPIVersionName(apis, usedApi.id)
          .then(function (userApiVersionName) {
            userApiVersionName.should.equal(apiVersionName);

            commandPromptStub.getInput.calledThrice.should.be.true();
            commandPromptStub.getInput
              .calledWithExactly(apiVersionNamePromptMessage).should.be.true();

            calledXTimesWithoutParameters(
              messagesStub.apiVersionNamePromptMessage, 3);

            loggerStub.info.calledTwice.should.be.true();
            loggerStub.info
              .alwaysCalledWithExactly(repeatedAPIVersionNameMessage)
              .should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      it('should ask again when API version name is blank', function (done) {
        var emptyName = ' ';
        commandPromptStub.getInput.onFirstCall()
          .returns(BPromise.resolve(emptyName));
        commandPromptStub.getInput.onSecondCall()
          .returns(BPromise.resolve(emptyName));
        commandPromptStub.getInput.onThirdCall()
          .returns(BPromise.resolve(apiVersionName));

        strategy.getAPIVersionName(apis, usedApi.id)
          .then(function (userApiVersionName) {
            userApiVersionName.should.equal(apiVersionName);

            commandPromptStub.getInput.calledThrice.should.be.true();
            commandPromptStub.getInput
              .calledWithExactly(apiVersionNamePromptMessage).should.be.true();

            calledXTimesWithoutParameters(
              messagesStub.apiVersionNamePromptMessage, 3);

            loggerStub.info.calledTwice.should.be.true();
            loggerStub.info
              .alwaysCalledWithExactly(emptyFieldError).should.be.true();

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      describe('errors', function () {
        var error = 'error';
        beforeEach(function () {
          commandPromptStub.getInput.returns(BPromise.reject(error));
        });

        it('should rethrow errors', function (done) {
          strategy.getAPIVersionName(apis, usedApi.id)
            .then(function () {
              done('should have failed!');
            })
            .catch(function (err) {
              err.should.equal(error);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getRootRamlPath', function () {
      it('should return selected root raml path', function (done) {
        var files = _.range(1, 5);
        var rootRamlPath = files[0];
        commandPromptStub.getRawChoice.returns(BPromise.resolve(rootRamlPath));

        strategy.getRootRamlPath(files)
          .then(function (selectedRootRamlPath) {
            selectedRootRamlPath.should.equal(rootRamlPath);

            asserts.calledOnceWithExactly(commandPromptStub.getRawChoice, [
              rootRamlPathPromptMessage,
              files
            ]);
            asserts.calledOnceWithoutParameters([
              messagesStub.rootRamlPathPromptMessage
            ]);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('batch', function () {
    var error = {error: 'error'};
    var businessGroup = businessGroups[0];
    var api = apis[0];
    var apiVersion = api.versions[0];
    var newApiVersionName = 'pepe';
    var rootRamlPath = 'api.raml';
    var batchParameters;

    beforeEach(function () {
      errorsStub.ChoiceNotFoundError = sinon.stub().returns(error);
      batchParameters = {
        bizGroup: businessGroup.id,
        apiId: api.id,
        apiVersion: newApiVersionName,
        rootRamlPath: rootRamlPath
      };
      strategy = getStrategy(batchParameters);
    });

    describe('getCreateAPIorAPIVersionChoice', function () {
      describe('when passing api name', function () {
        beforeEach(function () {
          batchParameters = {
            bizGroup: businessGroup.id,
            apiName: api.name,
            apiVersion: newApiVersionName
          };
          strategy = getStrategy(batchParameters);
        });

        it('should return true', function (done) {
          strategy.getCreateAPIorAPIVersionChoice()
            .then(function (createAPI) {
              createAPI.should.be.ok();

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });

      describe('when passing api id', function () {
        beforeEach(function () {
          batchParameters = {
            bizGroup: businessGroup.id,
            apiId: api.id,
            apiVersion: newApiVersionName
          };
          strategy = getStrategy(batchParameters);
        });

        it('should return false', function (done) {
          strategy.getCreateAPIorAPIVersionChoice()
            .then(function (createAPI) {
              createAPI.should.not.be.ok();

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getBusinessGroup', function () {
      it('should return selected business group', function (done) {
        strategy.getBusinessGroup(businessGroups)
          .then(function (selectedBusinessGroup) {
            selectedBusinessGroup.should.equal(businessGroup);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
      describe('should fail when', function () {
        beforeEach(function () {
          strategy = getStrategy({
            bizGroup: 123,
            api: 123,
            apiVersion: 123
          });
        });

        it('selecting inexistent business group', function (done) {
          strategy.getBusinessGroup(businessGroups)
            .then(function () {
              done('should have failed');
            })
            .catch(function () {
              errorsStub.ChoiceNotFoundError.calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(errorsStub.ChoiceNotFoundError, [
                businessGroupDescription
              ]);
              asserts.calledOnceWithoutParameters([
                messagesStub.businessGroupDescription
              ]);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getAPI', function () {
      it('should return selected API', function (done) {
        strategy.getAPI(apis)
          .then(function (selectedAPI) {
            selectedAPI.should.equal(api);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      describe('should fail when', function () {
        beforeEach(function () {
          batchParameters.apiId = 1234;
          strategy = getStrategy(batchParameters);
        });

        it('selecting inexistent API', function (done) {
          strategy.getAPI(apis)
            .then(function () {
              done('should have failed');
            })
            .catch(function () {
              errorsStub.ChoiceNotFoundError.calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(errorsStub.ChoiceNotFoundError, [
                apiDescription
              ]);
              asserts.calledOnceWithoutParameters([
                messagesStub.apiDescription
              ]);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getAPIName', function () {
      var newApiName = 'newApi';
      beforeEach(function () {
        batchParameters.apiName = newApiName;
        batchParameters.apiVersion = newApiVersionName;
        delete batchParameters.apiId;
        strategy = getStrategy(batchParameters);
      });

      it('should return entered api name', function (done) {
        strategy.getAPIName(apis)
          .then(function (enteredApiName) {
            enteredApiName.should.equal(newApiName);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      describe('should fail when', function () {
        var numberApiName = parseInt(api.name);
        beforeEach(function () {
          batchParameters.apiName = numberApiName;
          strategy = getStrategy(batchParameters);
        });

        it('name is already used', function (done) {
          strategy.getAPIName(apis)
            .then(function () {
              done('should have failed');
            })
            .catch(function () {
              errorsStub.RepeatedAPINameError.calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(errorsStub.RepeatedAPINameError, [
                api.id,
                numberApiName
              ]);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getAPIVersionName', function () {
      it('should return entered api name', function (done) {
        strategy.getAPIVersionName(apis)
          .then(function (enteredApiNameVersion) {
            enteredApiNameVersion.should.equal(newApiVersionName);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      describe('should fail when', function () {
        var numberApiVersionName = parseInt(apiVersion.name);
        beforeEach(function () {
          batchParameters.apiId = api.id;
          batchParameters.apiVersion = numberApiVersionName;
          strategy = getStrategy(batchParameters);
        });

        it('version name is already used', function (done) {
          strategy.getAPIVersionName(apis, batchParameters.apiId)
            .then(function () {
              done('should have failed');
            })
            .catch(function () {
              errorsStub.RepeatedAPIVersionNameError
                .calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(
                  errorsStub.RepeatedAPIVersionNameError, [
                apiVersion.id,
                numberApiVersionName
              ]);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });

    describe('getRootRamlPath', function () {
      var filesPath = [
        '/' + rootRamlPath,
        '/api2.raml',
        'folder1/api3.raml'
      ];

      it('should return selected root raml path name', function (done) {
        strategy.getRootRamlPath(filesPath)
          .then(function (selectedRootRamlPath) {
            selectedRootRamlPath.should.equal('/' + rootRamlPath);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });

      describe('should fail when', function () {
        beforeEach(function () {
          batchParameters.rootRamlPath = 'pepe.raml';
          strategy = getStrategy(batchParameters);
        });

        it('root raml is no in the root of the folder', function (done) {
          strategy.getRootRamlPath(rootRamlPath)
            .then(function () {
              done('should have failed');
            })
            .catch(function () {
              errorsStub.ChoiceNotFoundError
                .calledWithNew().should.be.true();
              asserts.calledOnceWithExactly(
                  errorsStub.ChoiceNotFoundError, [
                rootRamlDescription
              ]);
              asserts.calledOnceWithoutParameters([
                messagesStub.rootRamlDescription
              ]);

              done();
            })
            .catch(function (err) {
              done(err);
            });
        });
      });
    });
  });
});

function getStrategy(parameters) {
  var strategy;
  run(function (createStrategyFactory) {
    strategy = createStrategyFactory.get(parameters);
  });
  return strategy;
}

function getStrategyForErrorCases(parameters) {
  var strategy;
  runForErrors(function (createStrategyFactory) {
    strategy = createStrategyFactory.get(parameters);
  });
  return strategy;
}

function sortByName(objects) {
  return _.sortBy(objects, 'name');
}

function calledXTimesWithoutParameters(stubFunction, times) {
  stubFunction.callCount.should.equal(times);
  _.range(0, times).forEach(function (time) {
    stubFunction.getCall(time).args.length.should.equal(0);
  });
}

function run(callback) {
  var container = makeContainer();
  container.register('errors', errorsStub);
  container.resolve(callback);
}

function runForErrors(callback) {
  var container = makeContainer();
  container.register('errors', interactiveErrorsStub);
  container.resolve(callback);
}

function makeContainer() {
  var container = containerFactory.createContainer();
  container.register('commandPrompt', commandPromptStub);
  container.register('logger', loggerStub);
  container.register('messages', messagesStub);
  return container;
}
