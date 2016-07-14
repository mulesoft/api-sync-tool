# api-sync-tool
API-Sync is a tool that synchronizes an API that's hosted in the [Anypoint Platform](http://anypoint.mulesoft.com) with a local filesystem. There are several use cases where this would come in very handy.

**Use Case #1:** Designing a [RAML-based](http://raml.org) API on a Mac/Windows/Linux desktop and migrating that design to Anypoint.

The are various tools for designing RAML-based APIs. You could create an account on the Anypoint platform and use the Web-based API Designer which is built into that platform's API Manager section. Or, you can run your own version of [API Designer](https://www.npmjs.com/package/api-designer). Since it's a Web app that runs on node.js (server-side Javascript), you can "serve" API Designer from the Web server of your choice or even locally from a Web server on your desktop or notebook. Another desktop/notebook alternative is to run the [Atom Integrated Development Environment (IDE)](http://atom.ie) with the [API Workbench](http://apiworkbench.com/) plug-in.

As you code and save your RAML-based designs, eventually, you will want to migrate them to a platform like Anypoint where they can be hosted and managed.

**Use Case #2:** Collaborating on an API design with other API designers and using a version control and code repository system like [Github](http://github.com) as the central remote repository. As with the first use case, Atom makes for a great RAML-design editor because its robust support for the git protocols. If you have control over the central remote repository (ie: your own OS X or Linux-based git server), then, when a RAML-based design is finalized and saved in that server's filesystem, API Sync can be run from there to sync that design to Anypoint.

To install API-Sync, the host system will need to be running node.js. So, if you're not already running node, be sure to install it.  Then, install api-sync with:

```
npm install -g api-sync
```
Next, assuming you have an API design to sync and an account on the Anypoint platform, you'll run API-Sync:

```
api-sync
```

## Available options:
- setup: Allows user to select the Business Group and API Version that will be synchronized in the working directory.
- pull: Downloads all the files from the selected API.
- push: Uploads the new and changed files and deletes the deleted files.
- status: Shows the working directory (and subdirectories) status (added, deleted and changed files).
- cleanup: Removes metadata associated with the working directory (BizGroup and API choices, stored credentials, etc.)



## Keeping users logged in
To keep users logged in, this tool stores an access token in a hidden file in the user's home directory. This token has an expiration time that can be configured by its organization admin.

## Developing

Using the local code version:
```
npm install

npm link

api-sync
```
