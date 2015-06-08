'use strict';

require('should');
var sinon = require('sinon');

var containerFactory  = require('../support/testContainerFactory');

var csRepositoryStub = {};

describe('userOrganizationService', function () {
  beforeEach(function () {
    csRepositoryStub.getUserInfo = sinon.stub().returns(Promise.resolve({
      memberOfOrganizations: [
        {
          id: 1,
          name: 'SubOrg',
          another: 'property'
        }
      ]
    }));
  });

  describe('getSubOrganizations', run(function (userOrganizationService) {
    it('should return user sub organizations', function (done) {
      userOrganizationService.getSubOrganizations()
        .then(function (subOrgs) {
          csRepositoryStub.getUserInfo.called.should.be.true;

          subOrgs.should.be.an.Array;
          subOrgs.length.should.equal(1);
          subOrgs[0].should.have.properties('id', 'name');
          subOrgs[0].should.not.have.properties('another');
          subOrgs[0].id.should.equal(1);
          subOrgs[0].name.should.equal('SubOrg');

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
