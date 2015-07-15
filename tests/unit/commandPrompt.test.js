'use strict';

var _ = require('lodash');
var should = require('should');
var sinon = require('sinon');

var asserts = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var inquirerStub = {};

var message = 'A message';

describe('commandPrompt', function () {
  var separator = {separator: true};
  var nameAttr = 'key';
  var valueAttr = 'name';
  var otherAttr = 'otherStuff';
  var name = 'lala';
  var value = 'value';
  var other = 'other';

  beforeEach(function () {
    inquirerStub.prompt = sinon.stub();
    inquirerStub.Separator = sinon.stub().returns(separator);
  });

  describe('getChoice', run(function (commandPrompt) {
    it('should prompt for a choice with separator', function (done) {
      // Options to be passed to commandPrompt.
      var rawOptions = _.range(10).map(function (i) {
        var rawOption = {};
        rawOption[nameAttr] = name + i;
        rawOption[valueAttr] = value + i;
        rawOption[otherAttr] = other + i;

        return rawOption;
      });

      // Options expected to be received by inquirer.
      var inquirerOptions = _.map(rawOptions, function (rawOption) {
        return {
          name: rawOption[nameAttr],
          value: rawOption[valueAttr]
        };
      });
      inquirerOptions.push(separator);

      inquirerStub.prompt.callsArgWith(1, {
        answer: 'value0'
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

          inquirerStub.Separator.calledWithNew().should.be.true();

          choice.should.be.an.Object();
          should.deepEqual(choice, rawOptions[0]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should prompt for a choice without separator', function (done) {
      // Options to be passed to commandPrompt.
      var rawOptions = [{}];
      rawOptions[0][nameAttr] = name;
      rawOptions[0][valueAttr] = value;
      rawOptions[0][otherAttr] = other;

      // Options expected to be received by inquirer.
      var inquirerOptions = _.map(rawOptions, function (rawOption) {
        return {
          name: rawOption[nameAttr],
          value: rawOption[valueAttr]
        };
      });

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

          asserts.notCalled([inquirerStub.Separator]);

          choice.should.be.an.Object();
          should.deepEqual(choice, rawOptions[0]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  }));

  describe('getRawChoice', run(function (commandPrompt) {
    it('should prompt for a choice with separator', function (done) {
      var options = _.range(10);
      var inquirerOptions = _.range(10);
      inquirerOptions.push(separator);

      inquirerStub.prompt.callsArgWith(1, {
        answer: 0
      }).returns();

      commandPrompt.getRawChoice(message, options)
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

          inquirerStub.Separator.calledWithNew().should.be.true();

          should.deepEqual(choice, options[0]);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should prompt for a choice without separator', function (done) {
      var options = _.range(9);
      var inquirerOptions = _.range(9);

      inquirerStub.prompt.callsArgWith(1, {
        answer: 0
      }).returns();

      commandPrompt.getRawChoice(message, options)
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

          asserts.notCalled([inquirerStub.Separator]);

          should.deepEqual(choice, options[0]);

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

  describe('getInput', run(function (commandPrompt) {
    it('should prompt for a text input', function (done) {
      var input = 'input';
      inquirerStub.prompt.callsArgWith(1, {
        input: input
      }).returns();

      commandPrompt.getInput(message)
        .then(function (answer) {
          asserts.calledOnceWithExactly(inquirerStub.prompt, [
            sinon.match({
              type: 'input',
              name: 'input',
              message: message
            }),
            sinon.match.func
          ]);

          answer.should.be.equal(input);
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
