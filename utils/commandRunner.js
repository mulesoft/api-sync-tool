'use strict';

module.exports = function (authenticationService, contextFactory,
  contextHolder, loginPrompt) {
  return {
    run: run
  };

  function run(command, args) {
    return command.validateSetup()
      .then(function () {
        contextHolder.set(contextFactory.create());
        return command.validateInput(args);
      })
      // TODO: users must be able to login in a non-interactive way.
      .then(loginPrompt.getUserCredentials)
      .then(function (user) {
        return authenticationService.login(user.name, user.password);
      })
      .then(function (authentication) {
        contextHolder.set(contextFactory.create(authentication, process.cwd()));
        return command.execute(args);
      });
  }
};
