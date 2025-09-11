# Code Freeze: v1.0.0 Release

Effective immediately on branch `dev`.

Allowed changes during freeze:

- Critical and high-priority bug fixes only
- Test, CI, and documentation updates
- Release engineering tasks (versioning, tagging, packaging)

Not allowed:

- New features, refactors without a blocking bug, large dependency upgrades

Process:

- Use conventional commits with allowed scopes
  (`modals, ui, data, config, services, components, api, tests, deps`).
- Commit fixes on `dev` only; avoid new features during freeze.
- Keep `Release-Checklist.md` up to date.
