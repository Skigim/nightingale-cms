# Versioning Policy

This project follows Semantic Versioning (SemVer) with a disciplined pre-release (RC) stage.

## 1. Scheme

`MAJOR.MINOR.PATCH[-PRERELEASE]`

- MAJOR: Incompatible API / contract changes.
- MINOR: Backwards-compatible feature additions & enhancements.
- PATCH: Backwards-compatible bug fixes or internal refactors with no surface change.
- PRERELEASE: `-alpha.N`, `-beta.N`, `-rc.N` used progressively for stability phases.

## 2. Pre-Release Phases

- alpha: Exploratory / unstable. Public contracts may change freely.
- beta: Feature set frozen; only polish, perf, and risk-reducing adjustments.
- rc (release candidate): Only critical fixes (security, correctness, build, docs). No new features.

## 3. Promotion Rules

- Move from beta → rc when: feature scope locked, all blocking TODOs triaged.
- Increment rc number (`-rc.1` → `-rc.2`) only when code or docs materially change.
- Release final `MAJOR.MINOR.PATCH` by dropping the suffix **with no other code changes** ideally.

## 4. Breaking Changes

A change is breaking if it:

- Alters or removes a public prop, exported function, or expected data shape.
- Changes side-effect timing (e.g., fires events earlier/later) impacting consumer logic.
- Modifies persistence format such that existing saved data would error or lose information.

If breaking changes are needed during RC, revert to a new `-beta.1` cycle instead of silently
expanding scope.

## 5. Changelog Discipline

Each merged PR should supply a conventional commit. Release notes derive from:

- feat: Added under Added.
- fix: Under Fixed.
- refactor / perf: Under Changed or Performance.
- docs / chore not listed unless user-visible.

## 6. Tagging & Branching

- Pre-releases: Tag as `v1.0.0-rc.N` on `dev` (or `release/*` if used).
- Final: Tag `v1.0.0` on `dev`, then fast-forward / merge to `main`.
- Ensure CI green before pushing a tag.

## 7. Verification Gate Before Final

- Coverage trending upward toward threshold (≥80% global target; staged ramp acceptable).
- No open critical / high severity issues.
- Data integrity report exit code != 2.
- Bundle size within target budgets (adjust ratcheting values as needed).
- Manual test matrix completed and archived.

## 8. Post-Release Patch Flow

- Urgent fixes: Increment PATCH (e.g., 1.0.1). No new features in a patch.
- Minor feature tranche: 1.1.0 after grouping several small enhancements.

## 9. Tooling Suggestions (Future)

- Add a CHANGELOG generation script using conventional commits.
- CI job verifying tag == `package.json` version for release builds.
- Automatic RC tag creation on pushes to `release/*` branches.

## 10. Current Status

Active pre-release: `1.0.0-rc.2` (stabilization phase). Next target: `1.0.0` once coverage, manual
test matrix, and performance metrics are recorded.
