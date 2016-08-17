'use strict';

var _ = require('lodash');

module.exports = function (apiPlatformService, logger, messages) {
  return {
    update: update
  };

  function update(changedFile, remoteFiles, workspace) {
    var changedFileObject = _.find(remoteFiles, 'path', changedFile);
    logger.info(messages.uploadingFile(changedFile));
    return apiPlatformService.updateAPIFile(
        workspace.bizGroup.id,
        workspace.api.id,
        workspace.apiVersion.id,
        changedFileObject)
      .tap(function (changedFileResult) {
        var fileInWorkspace = _.find(workspace.files, 'path', changedFileResult.path);
        var olderAudit = fileInWorkspace ? fileInWorkspace.audit : null;
        if (olderAudit) {
          changedFileResult.audit.created = olderAudit.created;
        }
        workspace.files =
          _.reject(workspace.files, 'path', changedFileResult.path);
        workspace.files.push(changedFileResult);
      });
  }
};
