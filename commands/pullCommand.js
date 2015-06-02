'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformService, messages) {
  return {
    execute: execute
  };

  function parse(args) {
    if (args._.length < 3) {
      return Promise.reject(new Error(messages.pullUsage()));
    }

    return Promise.resolve({
      id: args._[1],
      versionId: args._[2]
    });
  }

  function print(files) {
    console.log(messages.status({added: files}));
  }

  function execute(args) {
    return parse(args)
      .then(function (api) {
        return apiPlatformService.pullAPIFiles(api);
      })
      .then(print);
  }
};
