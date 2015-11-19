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
    localServiceStub.getStatus = sinon.stub();
    localServiceStub.getConflicts = sinon.stub();
  });

  describe('status', function () {
    it('should return status', function (done) {
      localServiceStub.getStatus.returns(BPromise.resolve(expectedStatus));
      localServiceStub.getConflicts.returns(BPromise.resolve(expectedConflicts));

      run(function (statusController) {
        statusController.status()
          .then(function (result) {
            asserts.calledOnceWithoutParameters([
              localServiceStub.getStatus,
              localServiceStub.getConflicts
            ]);

            should.deepEqual(result, {
              status: expectedStatus,
              conflicts: expectedConflicts
            });

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
