'use strict';

var BPromise = require('bluebird');

var should = require('should');
var sinon = require('sinon');

var asserts  = require('../support/asserts');
var containerFactory  = require('../support/testContainerFactory');

var localServiceStub = {};

var expectedStatus = {
  addedDirectories: ['/folder'],
  added: ['api.raml'],
  changed: ['schema.json'],
  deleted: ['example.json']
};

var expectedConflicts = {
  addedDirectories: ['/folder'],
  added: ['api.raml'],
  changed: ['schema.json'],
  deleted: ['example.json']
};

describe('statusController', function () {
  beforeEach(function () {
    localServiceStub.status = sinon.stub();
    localServiceStub.conflicts = sinon.stub();
  });

  describe('status', function () {
    it('should return status', function (done) {
      localServiceStub.status.returns(BPromise.resolve(expectedStatus));

      run(function (statusController) {
        statusController.status()
          .then(function (result) {
            asserts.calledOnceWithoutParameters([
              localServiceStub.status
            ]);

            should.deepEqual(result, expectedStatus);

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe('conflicts', function () {
    it('should return conflicts', function (done) {
      localServiceStub.conflicts.returns(BPromise.resolve(expectedConflicts));

      run(function (statusController) {
        statusController.conflicts()
          .then(function (result) {
            asserts.calledOnceWithoutParameters([localServiceStub.conflicts]);

            should.deepEqual(result, expectedStatus);

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
  container.register('localService', localServiceStub);
  container.resolve(callback);
}
