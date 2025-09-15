# Nightingale CMS – Full UI Migration Guide (TypeScript + MUI)

> Objective: Replace the legacy JS + Tailwind + custom UI registry layer with a TypeScript‑first,
> MUI‑native design system and application shell while preserving functional parity and minimizing
> user disruption.

This guide documents the authoritative sequence, scope boundaries, success criteria, and quality
gates for the full migration. Treat each phase as _done_ only when its exit criteria are satisfied.
Avoid starting more than one complex phase concurrently.

---

## 0. Principles

1. Parity before embellishment – match existing behaviors before adding new UX.
2. Stable main branch – every merged commit builds, tests pass, no partial broken features.
3. Incremental visibility – ship dormant code behind feature flags (where helpful) instead of
   long‑lived branches.
4. Eliminate duplication quickly – once a screen is migrated, delete old component usage in same PR.
5. Observability – log key UX state changes during migration (tab switching, data loads) to surface
   regressions early.
6. Strong typing early – introduce domain types before porting complex orchestrators (Tabs,
   DataGrid, Stepper).

---

## 1. Scope Summary

In Scope:

- Adoption of `@mui/material`, `@mui/x-data-grid`, emotion styling, and a unified MUI theme.
- Conversion of UI components to TypeScript (`.tsx`).
- Decommission of Tailwind classes in UI layer (may remain in legacy pages temporarily).
- Replacement of: Buttons, Badges, Header (AppBar), Sidebar (Drawer), Modal (Dialog), Stepper, Tabs,
  DataTable → DataGrid, Form Controls, Toast system → Snackbar, Progress indicators, Menus,
  Accordions.
- Removal of dynamic runtime registry _after_ all consumers use static imports (final phase).

Out of Scope (explicitly):

- Backend/data model changes.
- New feature development (unless required for parity e.g., better accessibility).
- Full visual redesign (styling refinements allowed, but no drastic layout changes beyond MUI
  alignment).

---

## 2. High-Level Phases

| Phase | Title                                                 | Core Deliverable                  | Risk | Parallelization |
| ----- | ----------------------------------------------------- | --------------------------------- | ---- | --------------- |
| 0     | Preparation & Baseline Tooling                        | tsconfig, theme scaffold, deps    | Low  | Blocker for all |
| 1     | Foundational Theme & Tokens                           | Stable theme + design tokens doc  | Low  | Enables 2–6     |
| 2     | Core Primitives (Buttons, Badges, Progress)           | MUI replacements live             | Low  | Parallel with 3 |
| 3     | Layout Shell (AppBar + Drawer)                        | App structural frame              | Med  | After 1         |
| 4     | Dialog & Stepper Refactor                             | MUI Dialog + StepperModal rewrite | Med  | After 2         |
| 5     | Tabs & Tab Factory Migration                          | MUI Tabs + refactored TabBase     | High | After 2,4       |
| 6     | DataTable → DataGrid                                  | Unified data grid wrapper         | High | After 1         |
| 7     | Forms Suite (TextField, Select, etc.)                 | TS form components                | High | After 1         |
| 8     | Notifications & Feedback                              | Snackbar bridge, error states     | Med  | After 2         |
| 9     | Advanced Components (Menu, Accordion, Chips decision) | Added patterns                    | Low  | After 2         |
| 10    | Tailwind Decommission (UI Layer)                      | Remove dependencies               | Med  | After 2–9       |
| 11    | Registry Retirement & Cleanup                         | Static imports, delete registry   | Med  | Final           |

---

## 3. Detailed Phase Plans

### Phase 0 – Preparation & Baseline Tooling

**Goals:** Non‑breaking setup enabling dual JS/TS operation.

Tasks:

1. Add dependencies:
   `@mui/material @mui/icons-material @emotion/react @emotion/styled @mui/x-data-grid`.
2. Create `tsconfig.json` with `"allowJs": true`, `"checkJs": false` initially, module resolution
   aligning with existing bundler.
3. Add `types` script (`tsc --noEmit`) to CI for static checking early (optional pre-commit hook
   later).
4. Add `src/theme/index.ts` with `createTheme` skeleton (palette placeholders only).
5. Wrap root React render in `<ThemeProvider>` + `<CssBaseline />`.
6. Add `docs/Design-Tokens.md` stub.

Exit Criteria:

- App runs with theme provider and no visual regressions.
- Build & tests green.

### Phase 1 – Foundational Theme & Tokens

**Goals:** Establish design language parity with legacy styling.

Tasks:

1. Define palette (primary, secondary, success, error, warning, info, neutral gray scale).
2. Typography scale mapping (Tailwind `text-sm`, `text-base`, etc.).
3. Shape (border radius) + spacing scale alignment.
4. Component overrides: Button (variants), Chip (status), Dialog (padding), Drawer (width), Tabs
   (indicator), DataGrid (header styling).
5. Export token reference cheat sheet in `Design-Tokens.md`.

Exit Criteria:

- ≥80% of recurring Tailwind utility patterns have token or theme override.
- Snapshot or visual check of 5 representative screens shows consistent typography & spacing.

### Phase 2 – Core Primitives (Buttons, Badges, Progress)

**Goals:** Replace high-frequency primitives early to validate theming & typing.

Tasks:

1. Convert `Button.jsx` → `Button.tsx` using MUI `<Button>`.
2. Map legacy variants (Primary, Danger, etc.) to `variant/color` combos; export same names.
3. Convert `Badge.jsx` → `Badge.tsx`; reimplement: count (MUI Badge), status & progress (Chips +
   optional icon / progress overlay).
4. Centralize loading spinner logic in a new `Progress.tsx` (Circular + Linear exports).
5. Update business components to import new TS primitives.

Exit Criteria:

- All legacy button & badge variant code removed.
- No failing tests referencing removed CSS classes.

### Phase 3 – Layout Shell (AppBar + Drawer)

**Goals:** Introduce MUI structural frame while keeping feature views unchanged.

Tasks:

1. Create `LayoutShell.tsx` housing `<AppBar>` / `<Toolbar>` + `<Drawer>`.
2. Migrate `Header` logic; retain name by re-exporting `Header` from new file.
3. Migrate `Sidebar` to Drawer (responsive: temporary on small screens, permanent on large).
4. Introduce navigation item config (array of { label, icon?, path }).
5. Adjust content container to account for AppBar height & Drawer width.

Exit Criteria:

- All pages wrapped in `LayoutShell`.
- No overlapping or double scrollbars.

### Phase 4 – Dialog & Stepper Refactor

**Goals:** Normalize modals and multistep workflows.

Tasks:

1. Replace `Modal.jsx` internals with MUI `<Dialog>`; keep external props stable.
2. Extract `useStepper` hook from `StepperModal` logic.
3. Rebuild `StepperModal` with `<Stepper>` + `<Step>` + `<StepLabel>` and Button primitives.
4. Introduce accessibility tests (focus trap, ESC close, aria attributes).

Exit Criteria:

- All modal usages rely on new Dialog; no legacy overlay markup remains.
- Step transitions still emit analytics/logging events (if any previously).

### Phase 5 – Tabs & Tab Factory Migration

**Goals:** Replace custom tab orchestration with MUI Tabs while preserving dynamic composition.

Tasks:

1. Analyze `TabBase` API (component resolution, data loading hooks).
2. Implement `TabContainer.tsx` using `<Tabs>` + `<Tab>` and controlled index state.
3. Refactor factory to produce panels only; container handles selection.
4. Add keyboard nav tests (arrow keys, home/end) and lazy mount logic if performance needed.
5. Remove custom tab header rendering code.

Exit Criteria:

- No manual tab selection state in business components outside new container.
- All prior tab sets function identically (including error and empty states).

### Phase 6 – DataTable → DataGrid

**Goals:** Modernize table with virtualization, built-in sorting/pagination.

Tasks:

1. Inventory current `DataTable` props & events.
2. Create `DataGridWrapper.tsx` translating legacy prop names to DataGrid config.
3. Implement custom cell renderers & empty/loading overlays.
4. Map selection & pagination callback semantics.
5. Performance test with largest realistic dataset.

Exit Criteria:

- All table usages replaced; pagination, sorting, selection still work.
- No console warnings from DataGrid.

### Phase 7 – Forms Suite (TextField, Select, Checkbox, RadioGroup, Switch)

**Goals:** Standardize form inputs with validation and consistent error display.

Tasks:

1. Break out `FormComponents` into discrete TS components.
2. Align prop contracts: `value`, `onChange`, `error`, `helperText`, `disabled`.
3. Provide field wrapper for label + description + error region.
4. Add unit tests for controlled behavior & validation rendering.
5. Replace all legacy form input usages.

Exit Criteria:

- No remaining direct HTML inputs in business layer except edge cases (file upload etc.).
- Consistent error message styling across form fields.

### Phase 8 – Notifications & Feedback (Snackbar, Progress Integration)

**Goals:** Consolidate to MUI Snackbar & unify progress reporting.

Tasks:

1. Wrap existing toast publisher to feed a centralized `<SnackbarProvider>` (custom) managing queue.
2. Map legacy toast levels to `severity` (info, success, warning, error).
3. Replace inline spinners with `Progress` component where appropriate.
4. Optionally convert ErrorBoundary fallback to use `<Alert>`.

Exit Criteria:

- All toasts visible through MUI Snackbar styling.
- Legacy toast UI file removable.

### Phase 9 – Advanced Components (Menu, Accordion, Chips Refinement)

**Goals:** Implement missing MUI targets and finalize chip/badge strategy.

Tasks:

1. Identify action clusters needing contextual `Menu` (e.g., card overflow buttons).
2. Replace any hand-written collapse patterns with `<Accordion>`.
3. Decide: `StatusBadge` family → `Chip` wrappers (document decision & API).
4. Update docs to reflect final usage patterns.

Exit Criteria:

- No duplicated custom collapse logic.
- Clear guidance in docs for when to use Chip vs Badge.

### Schema Normalization Update (People / Cases Name Fields)

As of normalization refactor (2025-09), `case.clientName` is deprecated. The canonical source for a
person's display name is `people[].name`.

Rationale:

- Eliminates stale denormalized snapshots when a person record is renamed.
- Simplifies UI logic—cases resolve names dynamically via `personId` → `people[].name`.
- Reduces migration overhead: only one field requires validation and correction.

Normalization Behavior (`normalizeDataset` in `dataFixes.js`):

- Ensures every person has `name` (derived from `firstName + lastName` or set to `Unknown Person`).
- Removes `case.clientName` when the referenced person exists.
- Retains `case.clientName` only for orphaned cases (missing or unmatched `personId`).
- Returns a summary (`peopleNameFixed`, `caseClientNameRemoved`, `orphanClientNamesRetained`).

UI Expectations:

- `CasesTab` and `CaseDetailsView` now rely solely on `person.name` and will surface an explicit
  placeholder if a name is missing, signaling a data integrity problem instead of silently falling
  back.

Migration Guidance for Existing Data Files:

1. Run the Settings → "Normalize Dataset" action (invokes `normalizeDataset`).
2. Commit the updated data file; removed `clientName` fields are intentional.
3. Remove any custom scripts or data pipelines that attempt to populate or rely on
   `case.clientName`.
4. If external exports still require a client name snapshot, generate it on demand during export (do
   not persist it back into the canonical dataset).

Backward Compatibility Notes:

- Legacy tooling referencing `case.clientName` should be updated to resolve person names directly.
- The normalization step is idempotent; repeated runs produce no additional mutations.

Testing Additions:

- `normalizeDataset.test.js` covers name generation, snapshot removal, orphan retention,
  idempotency.
- `migration.test.js` updated to assert absence of `case.clientName` on migrated cases.

Deprecation Timeline:

- Immediate: Field considered deprecated; no new writes.
- Future (removal window TBD): Data export paths and analytics to drop awareness of the field
  entirely.

### Phase 10 – Tailwind Decommission (UI Layer)

**Goals:** Remove dependency from UI components to prevent style drift.

Tasks:

1. Grep UI directory for Tailwind class patterns; replace with `sx` or theme variants.
2. Remove Tailwind directives from component-level styles.
3. If Tailwind only used by legacy pages, decide retention or full removal.
4. Update build config if Tailwind purge no longer needed.

Exit Criteria:

- UI components contain no Tailwind classes.
- (Optional) Tailwind dependency removed if not used elsewhere.

### Phase 11 – Registry Retirement & Cleanup

**Goals:** Simplify architecture; rely on direct imports.

Tasks:

1. Identify all dynamic `getRegistryComponent` usages; replace with static imports (codemod or
   manual).
2. Remove `registerComponent` calls; delete registry service.
3. Adjust docs & samples to show standard ES module imports.
4. Run tree-shaking / bundle analysis to confirm reduction.

Exit Criteria:

- No runtime component lookups; app compiles without registry code.
- Documentation updated (Architecture, README, MIGRATION_GUIDE final note).

---

## 4. Cross-Cutting Concerns

### TypeScript Adoption Path

Stage 1: allowJs, basic theme + primitives. Stage 2: Convert high fan-out components (registry,
theme, DataGrid wrapper). Stage 3: Introduce domain entity types (Person, Case, etc.). Stage 4:
Enable `strict` gradually (`noImplicitAny`, `strictNullChecks`). Stage 5: Remove remaining `.jsx` in
UI layer.

### Testing Strategy

Use Jest + RTL:

- Smoke test each migrated primitive (render, variant, disabled state).
- Accessibility tests for Dialog, Tabs, DataGrid (focus, roles, keyboard nav).
- Regression tests for DataGrid sorting/pagination state transitions.
- Snapshot tests only for _layout chrome_, not dynamic content.

### Performance & Bundle Size

- Track initial bundle size baseline (before MUI) and after major phases.
- Prefer named imports from `@mui/material` to help tree-shaking.
- Lazy-load heavy feature routes if bundle growth > threshold (define threshold, e.g., +150KB gzip).

### Accessibility

- Enforce semantic roles (Tabs, Dialog, Grid) rely on MUI defaults.
- Validate color contrast after final theme creation.
- Provide focus outlines consistent with brand (custom palette focus ring token).

### Documentation

- Add `/docs/MUI-Migration-Status.md` updated per phase completion.
- Update `README.md` only when majority of UI has switched (Phase 6 or 7).
- Final pass: consolidate into `Architecture-Context.md` removal of registry references.

---

## 5. Risk Matrix & Mitigations

| Risk                                         | Phase(s) | Mitigation                                                      |
| -------------------------------------------- | -------- | --------------------------------------------------------------- |
| Visual drift due to theme mismatch           | 1–3      | Snapshot baseline & targeted storybook/playground validation    |
| Hidden tab logic regressions                 | 5        | Add pre-migration test coverage; log tab switch events          |
| Data grid feature gaps (filters, selection)  | 6        | Gap analysis doc before implementation                          |
| Form validation differences                  | 7        | Centralize error prop contract; QA checklist                    |
| Toast timing changes                         | 8        | Keep old system in parallel behind feature flag for one release |
| Tailwind removal reveals layout dependencies | 10       | Replace utilities incrementally; maintain style parity doc      |
| Registry removal breaks dynamic composition  | 11       | Static import rehearsal in feature branch + codemod dry run     |

---

## 6. Metrics & Tracking

- % UI components migrated (count of legacy files remaining / initial count).
- TypeScript adoption (% of UI LOC typed).
- Bundle size delta (gzip main bundle).
- a11y check pass rate (axe violation count < target threshold).
- Defect rate (regression bugs per phase – aim ≤ 2 P1/P2 per phase).

---

## 7. Phase Gate Checklist (Template)

For each phase completion PR include:

- [ ] Phase tasks all implemented
- [ ] Tests added/updated
- [ ] Docs updated (Status + tokens if needed)
- [ ] Bundle/a11y check run
- [ ] Legacy code for replaced area removed
- [ ] Migration metrics updated

---

## 8. Final Decommission Steps

1. Remove unused assets (icons, css files, Tailwind config if fully retired).
2. Remove registry service and associated tests.
3. Run dependency prune: remove Tailwind, old spinner libs, unused polyfills.
4. Publish final architecture doc revision.
5. Tag release: `vNext-mui-complete` (or semantic version bump if external consumers exist).

---

## 9. Appendix

### Suggested Directory Structure (Mid-Migration)

```
src/
	theme/
		index.ts
	components/
		ui/ (legacy, shrinking)
		ds/ (new design system)
			primitives/
				Button.tsx
				Badge.tsx
				Progress.tsx
				Dialog.tsx
				Tabs/
				Forms/
			layout/
				AppBarHeader.tsx
				DrawerNav.tsx
				LayoutShell.tsx
			data/
				DataGridWrapper.tsx
			feedback/
				SnackbarProvider.tsx
	domain/
		entities.ts
	pages/
```

### Column Mapping Example (DataGrid)

Legacy column:

```js
{ key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status}/> }
```

New column:

```ts
{ field: 'status', headerName: 'Status', sortable: true, renderCell: (params) => <StatusBadge status={params.row.status} /> }
```

### Button Variant Mapping

| Legacy          | MUI Variant | MUI Color | Notes                             |
| --------------- | ----------- | --------- | --------------------------------- |
| PrimaryButton   | contained   | primary   |                                   |
| SecondaryButton | contained   | secondary |                                   |
| DangerButton    | contained   | error     |                                   |
| SuccessButton   | contained   | success   |                                   |
| OutlineButton   | outlined    | primary   | Could vary by theme               |
| GhostButton     | text        | primary   | Add low-emphasis styling override |
| LinkButton      | text        | primary   | Add underline + hover color       |

---

End of Guide.
