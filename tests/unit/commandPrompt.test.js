'use strict';

var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var inquirerStub = {};

var message = 'A message';

describe('commandPrompt', function () {
  beforeEach(function () {
    inquirerStub.prompt = sinon.stub();
  });

  describe('getChoice', run(function (commandPrompt) {
    var nameAttr = 'key';
    var valueAttr = 'name';
    var otherAttr = 'otherStuff';
    var name = 'lala';
    var value = 'value';
    var other = 'other';

    var rawOptions = [];
    rawOptions[0] = {};
    rawOptions[0][nameAttr] = name;
    rawOptions[0][valueAttr] = value;
    rawOptions[0][otherAttr] = other;

    var inquirerOptions = [{
      name: name,
      value: value
    }];

    it('should prompt for a choice', function (done) {
      inquirerStub.prompt.callsArgWith(1, {
        answer: 'value'
      }).returns();

      commandPrompt.getChoice(message, nameAttr, valueAttr, rawOptions)
        .then(function (choice) {
          asserts.calledOnceWithExactly(inquirerStub.prompt, [
            sinon.match({
              type: 'list',
              name: 'answer',
              message: message,
              choices: inquirerOptions
            }),
            sinon.match.func
          ]);

          choice.should.be.an.Object();
          should.deepEqual(choice, rawOptions[0]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getConfirmation', run(function (commandPrompt) {
    it('should prompt for a confirmation', function (done) {
      inquirerStub.prompt.callsArgWith(1, {
        confirm: true
      }).returns();

      commandPrompt.getConfirmation(message)
        .then(function (answer) {
          asserts.calledOnceWithExactly(inquirerStub.prompt, [
            sinon.match({
              type: 'confirm',
              name: 'confirm',
              message: message,
              default: true
            }),
            sinon.match.func
          ]);

          answer.should.be.ok();
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
    container.register('inquirer', inquirerStub);
    container.resolve(callback);
  };
}
