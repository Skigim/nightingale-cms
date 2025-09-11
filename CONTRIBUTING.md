# Contributing

This repository uses a dev-first branching model:

- `dev`: Primary integration branch for minor adjustments and bug testing.
- `main`: Stable, deployment-ready branch. Only updated via PRs from `dev`.
- Feature branches: Create from `dev` (e.g., `feature/xyz`, `bugfix/abc`) and merge back into `dev`
  via PR.

## Workflow

1. Branch from `dev`:
   - `git checkout dev && git pull`
   - `git checkout -b feature/short-description`
2. Commit using Conventional Commits:
   - `type(scope): short description`
   - Allowed scopes: `modals|ui|data|config|services|components|api|tests|deps`
3. Open a PR into `dev`:
   - Ensure CI is green (lint + tests).
4. Merge to `dev` after review.
5. Periodically open a PR from `dev` → `main` for release; do not push directly to `main`.

## CI & Deploy

- CI runs on `dev` and feature branches to validate linting and tests.
- Deploy workflow runs only on `main` push.

## Release Branch Flow

- Create a release branch from `dev` when stabilizing (e.g., `release/1.0.0`).
- Continue day-to-day work on `dev`. For release fixes, commit to `release/x.y.z` and then merge
  `release/x.y.z` back into `dev` to keep `dev` ahead.
- When ready to ship, merge `dev` → `main` via PR. Tags are created on the release branch (e.g.,
  `v1.0.0-rc.1`, `v1.0.0`).

## Coding Standards

- React 18 with ES modules; UI vs Business layer separation.
- No global window fallbacks; use registry/services.
- PropTypes required for all components.
- Tailwind utility classes; no inline styles.
