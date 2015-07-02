# api-sync-tool
Tool that synchronizes an API in API platform with local filesystem

Installing:
```
npm install -g api-sync

api-sync
```

## Available commands:
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
