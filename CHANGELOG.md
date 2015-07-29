# Change log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.0.5] - 2015-07
### Added
- New create command to generate a new API in Anypoint Platform
  - Create command can be run in interactive mode
  - Create command can add versions to existing APIs
- New detailed help option
  - Detailed help is shown when tool is executed with --help parameter
- The tool now warns users when Anypoint Platform has conflicts with local
  workspace

### Changed
- Cleanup command can now be executed without setup or authentication
- Filter .meta files in local workspace. Those files are only relevant to
  Anypoint API Designer

### Fixed
- Status command now displays new/deleted folders
- Push command now deletes local deleted folders in Anypoint Platform
