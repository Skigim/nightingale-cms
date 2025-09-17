# Big Bang Migration Acceptance Checklist

Minimal conditions required before removing legacy UI (`src/components/*`).

## Core Functionality

- [ ] Data initializes (migration run if needed) without uncaught errors.
- [ ] Backup created prior to first write (verify localStorage key suffixed `_backup_`).
- [ ] Case list renders real cases (0 state handled with empty prompt).
- [ ] Filtering by search term and status works.
- [ ] Selecting a case opens details view.
- [ ] Editing status persists across reload.
- [ ] Adding a note persists across reload.
- [ ] Adding a financial item persists.
- [ ] People & Organizations basic lists render (even if read-only).

## Technical

- [ ] No direct mutation of service data in UI components (checked via spot review / eslint rule if
      added).
- [ ] `caseService.updateCase` blocks system field overwrites.
- [ ] `useDataInitialization` + `useCases` hooks integrated.
- [ ] Feature flag `VITE_UI_SHELL` toggles new shell.
- [ ] ErrorBoundary wraps root shell.

## Quality & Accessibility

- [ ] Axe scan: no critical violations on main views (Dashboard, Cases, Case Details).
- [ ] Sidebar navigation uses `aria-current` on active item.
- [ ] Tables have appropriate header semantics.

## Safety Nets

- [ ] Git tag `pre-bigbang` exists.
- [ ] Legacy UI moved to `legacy-archive/` (not deleted) for 2 weeks.
- [ ] Smoke script manually run: create -> edit -> note add -> reload verify.

## Nice to Have (Optional Before Cut)

- [ ] Basic Jest tests for createCase duplicate MCN, subscription notify, migration bootstrap.
- [ ] Financial totals validated vs legacy for one sample dataset.

---

Update this file as items are satisfied. Once all mandatory items checked, proceed with removal PR.
