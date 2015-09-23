'use strict';

var BPromise = require('bluebird');

require('should');
var sinon = require('sinon');

var containerFactory = require('../support/testContainerFactory');

var csRepositoryStub = {};

describe('userOrganizationService', function () {
  beforeEach(function () {
    csRepositoryStub.getUserInfo = sinon.stub().returns(BPromise.resolve({
      contributorOfOrganizations: [
        {
          id: 1,
          name: 'bizGroup',
          another: 'property'
        }
      ]
    }));
  });

  describe('getBusinessGroups', run(function (userOrganizationService) {
    it('should return user business groups', function (done) {
      userOrganizationService.getBusinessGroups()
        .then(function (businessGroups) {
          csRepositoryStub.getUserInfo.called.should.be.true();

          businessGroups.should.be.an.Array();
          businessGroups.length.should.equal(1);
          businessGroups[0].should.have.properties('id', 'name');
          businessGroups[0].should.not.have.properties('another');
          businessGroups[0].id.should.equal(1);
          businessGroups[0].name.should.equal('bizGroup');

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
    container.register('csRepository', csRepositoryStub);
    container.resolve(callback);
  };
}
