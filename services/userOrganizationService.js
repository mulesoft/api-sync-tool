'use strict';

var _ = require('lodash');

module.exports = function (csRepository) {
  return {
    getSubOrganizations: getSubOrganizations
  };

  function getSubOrganizations() {
    return csRepository.getUserInfo()
      .then(function (user) {
        return _.map(user.memberOfOrganizations, function (subOrg) {
          return _.pick(subOrg, ['id', 'name']);
        });
      });
  }
};
