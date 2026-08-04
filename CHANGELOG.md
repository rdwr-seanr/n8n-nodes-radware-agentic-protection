# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-08-04

### Fixed

- Corrected the n8n AI SDK peer dependency from the nonexistent unscoped
  `ai-node-sdk` package to `@n8n/ai-node-sdk`.
- Made the n8n AI SDK a required peer dependency, matching n8n's installation
  contract for community AI model nodes.
- Added a package-manifest regression test for the required n8n peer
  dependencies.
- Upgraded the n8n node CLI from `0.32.1` to `0.42.0` so local linting and
  release validation use n8n's current AI node package rules.

## [0.3.1] - 2026-07-12

### Fixed

- Added the required corporate `author.email` metadata so the n8n community
  package scanner accepts the scoped package.
- `package.json` author metadata now uses the Radware corporate identity.

## [0.3.0] - 2026-07-12

### Changed

- Migrated the npm identity to the official Radware organization scope:
  `@radware/n8n-nodes-radware-agentic-protection`.
- Updated node identifiers, examples, documentation, npm links, and publishing
  instructions for the scoped package.
- Added customer migration guidance for installations using the legacy
  unscoped package.
- Set scoped npm releases to public through `publishConfig.access`.

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

### Notes

- Placeholder entry documenting the version that was live on npm
  before this changelog was introduced. No source changes are
  implied by this entry.
