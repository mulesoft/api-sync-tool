'use strict';

module.exports = function (authenticationService, configurationRepository, console, messages) {
  return {
    execute: execute,
    noContext: true
  };

  function parse(args) {
    if (args._.length < 3) {
      return Promise.reject(new Error(messages.loginUsage()));
    }

    return Promise.resolve({
      name: args._[1],
      password: args._[2]
    });
  }

  function print() {
    console.log(messages.loginSuccessful());
  }

  function execute(args) {
    return parse(args)
      .then(function (user) {
        var configuration = configurationRepository.getCurrentConfig();

        return authenticationService.login(user.name, user.password)
          .then(function (authentication) {
            configuration.authentication = authentication;

            configurationRepository.updateCurrentConfiguration(configuration);
          });
      })
      .then(print);
  }
};
