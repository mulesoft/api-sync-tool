'use strict';

module.exports = function (apiPlatformService, console, messages) {
  return {
    execute: execute
  };

  function execute(args) {
    return parse(args)
      .then(apiPlatformService.getAllAPIs)
      .then(print);
  }

  function parse(args) {
    return Promise.resolve(args);
  }

  function print(apis) {
    console.log(messages.apis(apis));
  }
};
