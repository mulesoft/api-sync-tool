'use strict';

module.exports = function (apiPlatformService, logger, messages) {
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
    logger.info(messages.apis(apis));
  }
};
