# Changelog

All notable changes to this project will be documented in this file.

The format loosely follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

### Added

- (placeholder) Add new entries here for features merged after `1.0.0-rc.2`.

### Changed

- (placeholder)

### Fixed

- (placeholder)

## [1.0.0-rc.2] - 2025-09-15

### Added

- Data integrity gate in CI (runs `scripts/data-integrity-report.js`).
- Consolidated CI & Deploy workflow (single pipeline with Pages publish).

### Changed

- Unified workflow name and added concurrency + permissions for Pages.

### Fixed

- Eliminated duplicate build/test runs on pull requests (removed separate deploy workflow).

## [1.0.0-rc.1] - 2025-09-??

### Added

- Person resolution utility centralizing lookup and display logic.
- Refactored `CasesTab` and `CaseDetailsView` to use shared person resolution.
- Updated React best practices documentation (streamlined & canonical references).
- README additions: Core utilities & data integrity section.

### Fixed

- Deterministic missing-person warning logging in `CaseDetailsView`.

### Removed

- Obsolete documentation files (legacy analysis & TODO docs).

[Unreleased]: https://github.com/Skigim/nightingale-cms/compare/v1.0.0-rc.2...HEAD
[1.0.0-rc.2]: https://github.com/Skigim/nightingale-cms/compare/v1.0.0-rc.1...v1.0.0-rc.2
