'use strict';

var _ = require('lodash');

module.exports = function (csRepository) {
  return {
    getBusinessGroups: getBusinessGroups
  };

  function getBusinessGroups() {
    return csRepository.getUserInfo()
      .then(function (user) {
        return _.map(user.contributorOfOrganizations, function (bizGroup) {
          return _.pick(bizGroup, ['id', 'name']);
        });
      });
  }
};
