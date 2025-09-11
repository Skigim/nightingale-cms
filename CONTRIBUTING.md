# Contributing

This repository uses a simple two-branch model:

- `dev`: Primary branch for day-to-day work, integration, UAT, and release candidates.
- `main`: Stable, deployment-ready branch. Only updated via PRs from `dev`.
- Feature branches (optional): Create from `dev` (e.g., `feature/xyz`, `bugfix/abc`) and merge back
  into `dev` via PR.

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
5. Open a PR from `dev` → `main` to release; do not push directly to `main`.

## CI & Deploy

- CI runs on `dev` and feature branches to validate linting and tests.
- Deploy workflow runs only on `main` push.

## Release Process (Two-Branch)

- Stabilize and conduct UAT directly on `dev`.
- Create release candidates by tagging on `dev` (e.g., `v1.0.0-rc.1`).
- When ready to ship, open a PR from `dev` → `main`, merge after checks pass, and create the final
  tag (e.g., `v1.0.0`).

## Coding Standards

- React 18 with ES modules; UI vs Business layer separation.
- No global window fallbacks; use registry/services.
- PropTypes required for all components.
- Tailwind utility classes; no inline styles.
