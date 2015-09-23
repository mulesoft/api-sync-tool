'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');
var asserts  = require('../support/asserts');

var osenvStub = {};
var fsStub = {};
var inquirerStub = {};
var loggerStub = {};
var processStub = {};
var superagentStub = {};

describe('setup', run(function (application) {
  var homeDirectory = '/Users/test';
  var workspaceDirectory = '/Users/test/api';

  var user = {
    name: 'Pepe1234',
    password: 'Pepe1234'
  };

  var falseChoice = {
    confirm: false
  };

  var firstIdChoice = {
    answer: 1
  };

  var loginResponse = {
    body: {
      access_token: '1234567890'
    }
  };

  var bizGroup = {
    id: 1,
    name: 'Pepe'
  };

  var userInfoResponse = {
    body: {
      contributorOfOrganizations: [bizGroup]
    }
  };

  var api1 = {
    id: 1,
    name: 'ZAPI',
    versions: [{
      id: 1,
      name: 'VersionAPI'
    },
    {
      id: 2,
      name: 'AVersionAPI'
    }]
  };

  var api2 = {
    id: 2,
    name: 'API',
    versions: [{
      id: 1,
      name: 'VersionAPI'
    },
    {
      id: 2,
      name: 'AVersionAPI'
    }]
  };

  var apisResponse = {
    body: {
      apis: [api1, api2]
    }
  };

  beforeEach(function () {
    fsStub.readFileSync = sinon.stub();
    fsStub.writeFileSync = sinon.stub();
    osenvStub.home = sinon.stub().returns(homeDirectory);
    processStub.cwd = sinon.stub().returns(workspaceDirectory);

    inquirerStub.prompt = sinon.stub();
    // Prompt for user credentials
    inquirerStub.prompt.onCall(0).callsArgWith(1, user);
    // Prompt for asking if credentials should be stored
    inquirerStub.prompt.onCall(1).callsArgWith(1, falseChoice);
    // Prompt for bizGroup selection
    inquirerStub.prompt.onCall(2).callsArgWith(1, firstIdChoice);
    // Prompt for API selection
    inquirerStub.prompt.onCall(3).callsArgWith(1, firstIdChoice);
    // Prompt for API Version selection
    inquirerStub.prompt.onCall(4).callsArgWith(1, firstIdChoice);
    // Prompt for asking if pull must be run
    inquirerStub.prompt.onCall(5).callsArgWith(1, falseChoice);

    superagentStub.post = sinon.stub().returnsThis();
    superagentStub.get = sinon.stub().returnsThis();
    superagentStub.send = sinon.stub().returnsThis();
    superagentStub.set = sinon.stub().returnsThis();
    superagentStub.query = sinon.stub().returnsThis();

    superagentStub.end = sinon.stub();
    // Request for login
    superagentStub.end.onFirstCall().returns(BPromise.resolve(loginResponse));
    // Request for user info
    superagentStub.end.onSecondCall().returns(BPromise.resolve(
      userInfoResponse));
    // Request for APIs
    superagentStub.end.onThirdCall().returns(BPromise.resolve(apisResponse));

    loggerStub.error = sinon.stub();
    loggerStub.info = sinon.stub();
    loggerStub.debug = sinon.stub();
    loggerStub.onComplete = sinon.stub();
  });

  it('should run setup command interactive mode', function (done) {
    var args = {
      _: ['setup']
    };

    application
      .run(args)
      .then(function () {
        asserts.notCalled([loggerStub.error, loggerStub.onComplete]);

        loggerStub.info.calledTwice.should.be.true();
        loggerStub.info.firstCall.args[0].should
          .equal('Enter your Anypoint Platform username and password');
        loggerStub.info.secondCall.args[0].should.equal('Current setup:\n' +
          '- Business group: ' + bizGroup.name + '\n' +
          '- API: ' + api1.name + ' ' +  api1.versions[0].name);

        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
}));

function run(callback) {
  return function () {
    var container = containerFactory.createContainer();
    container.register('osenv', osenvStub);
    container.register('fs', fsStub);
    container.register('inquirer', inquirerStub);
    container.register('logger', loggerStub);
    container.register('process', processStub);
    container.register('superagent', superagentStub);
    container.resolve(callback);
  };
}
