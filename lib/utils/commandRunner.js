'use strict';

module.exports = function (authenticationService, authenticationRepository,
    BPromise, commandPrompt, contextFactory, contextHolder, errors, logger,
    loginPrompt, messages, process) {
  return {
    run: run
  };

  function run(command, args) {
    return command.validateSetup()
      .return(command.validateInput(args))
      .then(function () {
        if (command.doesntNeedAuthentication) {
          return;
        }

        return authenticationRepository.get()
          .then(function (authentication) {
            if (authentication.accessToken) {
              return authentication;
            }
            return loginPrompt.getUserCredentials()
              .then(function (user) {
                return authenticationService.login(user.name, user.password);
              })
              .then(storeAuthentication);
          });
      })
      .then(function (authentication) {
        contextHolder.set(contextFactory.create(authentication, process.cwd()));
        return command.execute(command.parseArgs(args));
      })
      .catch(function (error) {
        // When login fails
        if (error instanceof errors.BadCredentialsError) {
          logger.debug('Bad credentials');
          return cleanupAuthentication()
            .then(function () {
              logger.info(messages.expiredTokenMessage());
              // Run command again
              return run(command, args);
            });
        } else {
          return BPromise.reject(error);
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

        return BPromise.resolve(newAuthentication);
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
