# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Migrated the npm identity to the official Radware organization scope:
  `@radware/n8n-nodes-radware-agentic-protection`.
- Updated node identifiers, examples, documentation, npm links, and publishing
  instructions for the scoped package.
- Added customer migration guidance for installations using the legacy
  unscoped package.
- Set scoped npm releases to public through `publishConfig.access`.

### Fixed

- `package.json` author metadata now uses the Radware corporate identity
  (`{"name": "Radware", "url": "https://www.radware.com"}`) instead of a
  personal email address.

### Added

- README: "Install in n8n (recommended)" section (Settings -> Community
  Nodes -> Install) as the primary install path, with the npm install
  documented as the self-hosted/manual alternative.
- README: "Getting your Radware API key" callout near the credential
  section, describing portal creation, the `sk-rdwr-` key prefix, and
  the one-time key display.
- `CHANGELOG.md` (this file).

### Changed

- Moved `docs/publishing.md` (maintainer-only publish checklist) to
  `internal/publishing.md` so it is not shipped in the published npm
  tarball. Removed the corresponding link from the public README.

## [0.2.2] - 2026-06-30

Current published version.

### Notes

- Placeholder entry documenting the version that was live on npm
  before this changelog was introduced. No source changes are
  implied by this entry.
