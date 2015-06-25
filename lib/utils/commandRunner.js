'use strict';

module.exports = function (authenticationService, authenticationRepository,
    commandPrompt, contextFactory, contextHolder, errors, loginPrompt,
    messages, process) {
  return {
    run: run
  };

  function run(command, args) {
    return command.validateSetup()
      .then(function () {
        return command.validateInput(args);
      })
      .then(authenticationRepository.get)
      .then(function (authentication) {
        if (authentication.accessToken) {
          return Promise.resolve(authentication);
        }
        return loginPrompt.getUserCredentials()
          .then(function (user) {
            return authenticationService.login(user.name, user.password);
          })
          .then(storeAuthentication);
      })
      .then(function (authentication) {
        contextHolder.set(contextFactory.create(authentication, process.cwd()));
        return command.execute(args);
      })
      .catch(function (error) {
        // When login fails
        if (error instanceof errors.BadCredentialsError) {
          return cleanupAuthentication()
            .then(function () {
              // Run command again
              return run(command, args);
            });
        } else {
          return Promise.reject(error);
        }
      });
  }

  /**
   * Store the authentication if the users approves it.
   *
   * @param  {Object} newAuthentication The user authentication object.
   * @return {Object} The user authentication object.
   */
  function storeAuthentication(newAuthentication) {
    return commandPrompt.getConfirmation(
        messages.storeAuthenticationPromptMessage())
      .then(function (shouldStore) {
        if (shouldStore) {
          return authenticationRepository.get()
            .then(function (authentication) {
              authentication.accessToken = newAuthentication.accessToken;

              return authenticationRepository.update(authentication);
            });
        }

        return Promise.resolve(newAuthentication);
      });
  }

  function cleanupAuthentication() {
    return authenticationRepository.get()
      .then(function (authentication) {
        // Clean authentication information
        delete authentication.accessToken;
        return authenticationRepository.update(authentication);
      });
  }
};
