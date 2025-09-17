# Legacy Structure Snapshot – 2025-09-17

This document captures the **current legacy `src/` tree** before removal and replacement with the
new TypeScript `.tsx` implementation. It provides an inventory, responsibilities, compatibility
behaviors, and a deletion readiness checklist.

> Recovery: Tag this commit before deletion (e.g. `backup/pre-legacy-removal-2025-09-17`). To
> restore any file later: `git checkout <tag> -- path/to/file`.

---

## 1. High-Level Layout (`src/`)

```
src/
  assets/                # Vendor libs (dayjs variants, fuse.js, etc.)
  components/
    business/            # Feature/workflow components (modals, tabs, app shell)
    ui/                  # UI building blocks (Modal, Buttons, Forms, Table, Stepper...)
  config/                # (Minimal / env placeholders)
  hooks/                 # Data initialization + unified data hooks
  pages/                 # Standalone HTML entry points (reports, correspondence)
  services/              # Core domain + infra services (registry, data mgmt, formatting)
  theme/                 # Theme entry
  main.js                # Application bootstrap
  setupTests.js          # Jest test environment setup
```

---

## 2. Business Components Inventory (`src/components/business/`)

| Component                      | Purpose                             | Notable Legacy Traits                            |
| ------------------------------ | ----------------------------------- | ------------------------------------------------ |
| NightingaleCMSApp.jsx          | Root shell / orchestrator           | Modal launch plumbing, TODO placeholders         |
| CaseCreationModal.jsx          | Multi-step case creation            | Inline validation, legacy field guards           |
| CaseDetailsView.jsx            | Case detail viewer                  | TODOs for extended relationships                 |
| CasesTab.jsx                   | Cases listing                       | TabBase pattern, provides `useCasesData`         |
| OrganizationModal.jsx          | Org create/edit                     | Accepts string address, less normalization       |
| OrganizationsTab.jsx           | Organizations table                 | Data hook injection                              |
| PersonCreationModal.jsx        | Person creation wizard              | Defensive `fullData` checks                      |
| PersonDetailsView.jsx          | Person viewer                       | Simple registry usage                            |
| PeopleTab.jsx                  | People listing                      | Provides `usePeopleData`                         |
| FinancialItemModal.jsx         | Financial entry create/edit         | Maps legacy `value/type/source` -> modern fields |
| FinancialItemCard.jsx          | Financial item display              | Registers multiple variants                      |
| FinancialManagementSection.jsx | Aggregated finances                 | Legacy field bridging                            |
| EligibilityTab.jsx             | Eligibility workflows               | Registry only                                    |
| NotesModal.jsx                 | Notes management                    | File service + registry                          |
| AvsImportModal.jsx             | AVS import                          | Normalizes imported legacy fields                |
| BugReportModal.jsx             | Feedback capture                    | Minimal local state                              |
| DashboardTab.jsx               | Dashboard metrics                   | Registry only                                    |
| SettingsModal.jsx              | Feature flags & migration detection | Uses `detectLegacyProfile`                       |

All business components self-register via: `registerComponent('business', '<Name>', Component)`.

---

## 3. UI Components Inventory (`src/components/ui/`)

Key primitives and composites: `Button`, `Badge`, `Cards`, `Modal`, `FormComponents` (FormField,
TextInput, Select, etc.), `DataTable`, `Header`, `Sidebar`, `Stepper`, `StepperModal`, `SearchBar`,
`TabBase`, `TabHeader`, `ErrorBoundary`.

Traits:

- Each registers with `'ui'` registry.
- `FormComponents` attempts global validator fallback, then module validators.
- `StepperModal` handles keyboard navigation, focus trap, dynamic footer.

---

## 4. Hooks (`src/hooks/`)

- `initData.ts`: Loads persisted data, optionally runs detection/migration (dynamic import of
  `migration.js`).
- `useData.ts`: Exposes base data hook + typed wrappers `usePeopleData`, `useOrganizationsData`,
  `useCasesData` powering listing tabs and modals.

These form the **current data access seam**—critical to replicate or wrap before deletion.

---

## 5. Services (`src/services/`)

| File                                      | Responsibility                            | Notes                                                |
| ----------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `registry.js`                             | Component registry (ui/business)          | Central dynamic instantiation API                    |
| `core.js`                                 | Validators, lightweight search fallback   | Exposes validator factory functions                  |
| `formatters.js`                           | Phone/SSN normalization                   | Used by forms & modals                               |
| `fileServiceProvider.js`                  | File I/O + permission abstraction         | Backing store connector                              |
| `nightingale.datamanagement.js`           | Data normalization (IDs, addresses)       | Accepts legacy string addresses; adds missing fields |
| `migration.js`                            | Legacy profile detection + full migration | Summarizes legacy indicators                         |
| `dataFixes.js`                            | Post-load normalization batch             | Cleans inconsistent shapes                           |
| `nightingale.autosavefile.js`             | Autosave scheduling + retries             | TODO comments for logger integration                 |
| `nightingale.search.js`                   | Search utilities                          | Fuse-based when available                            |
| `nightingale.logger.js`                   | Logging facade                            | Provides channel-based logger retrieval              |
| `nightingale.toast.js`                    | Toast publishing                          | Thin wrapper (with TODO)                             |
| `nightingale.parsers.js`                  | Parsing utilities                         | Supports data ingestion                              |
| `nightingale.documentgeneration.js`       | Document generation (templating)          | Backs output features                                |
| `nightingale.placeholders.js`             | Placeholder value expansion               | Used in templates                                    |
| `nightingale.templates.js`                | Template catalog                          | For document generation                              |
| `nightingale.clipboard.js`                | Clipboard utilities                       | Includes legacy wrappers                             |
| `safeDataMerge.js`                        | Defensive merge strategy                  | Guards shape drift                                   |
| `sampleData.js` / `staticSampleLoader.js` | Sample dataset loading                    | Tests + dev bootstrap                                |
| `personResolution.js`                     | Entity matching                           | Person disambiguation                                |
| `ui.js`                                   | Misc UI helpers (scroll, etc.)            | Legacy compatibility wrappers                        |
| `settings.js`                             | Feature flags (strict validation)         | Consumed in modals                                   |
| `logger-quickstart.js`, `toast-test.js`   | Developer diagnostics                     | Not needed in runtime prod build                     |

---

## 6. Pages (`src/pages/`)

Standalone HTML apps: `NightingaleReports.html`, `NightingaleCorrespondence.html`,
`logger-test.html`.

- Contain scripted logic referencing legacy data and todo functionality.
- If not ported, archive separately (may serve as historical reference or external tool).

---

## 7. Compatibility & Transformation Behaviors

| Domain          | Legacy Form                                | Normalized Target                           | Implemented In                                   |
| --------------- | ------------------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| Address         | String (`"123 Main, City, ST 12345"`)      | Object `{street, city, state, zip}`         | `nightingale.datamanagement.js`, loaders, modals |
| Financial Items | `{type, value, source}`                    | `{description, amount, verificationSource}` | `FinancialItemModal.jsx`, data management        |
| IDs             | Numeric or alt fields (`masterCaseNumber`) | Prefixed strings (`case-###`, `person-###`) | Migration + datamanagement                       |
| Personnel (org) | Minimal entries                            | Normalized array with optional filtering    | (Legacy) + new modal design (future)             |
| Validation      | Loose, form-sparse                         | Central validators in `core.js`             | Consumers may bypass absent validators           |

---

## 8. Registry Pattern

API surface to replicate:

```js
registerComponent(registryName, componentName, component);
getComponent(registryName, componentName);
listComponents(registryName);
```

All new code must provide a drop-in equivalent before legacy deletion to avoid dynamic resolution
failures.

---

## 9. Deletion Readiness Checklist

Status columns left blank for you to mark during migration.

| Item                     | Action Needed                              | Status |
| ------------------------ | ------------------------------------------ | ------ |
| Registry API parity      | Implement new TS registry or facade        |        |
| Data hooks parity        | Provide replacements for `use*Data`        |        |
| Validators               | Re-export or port validator factory        |        |
| Formatters               | Port `formatUSPhone`, `formatSSN` etc.     |        |
| Data normalization       | Extract necessary functions (address, IDs) |        |
| Migration logic decision | Keep, slim, or drop? Document choice       |        |
| File service             | New provider implements same contract      |        |
| Autosave (if needed)     | Port essential parts only                  |        |
| Search                   | Provide new search abstraction or stub     |        |
| Toast / Logger           | Provide platform facade                    |        |
| Tests updated            | No imports from `src/` left                |        |
| Pages strategy           | Archive or port required ones              |        |
| Changelog entry          | Document removal + replacements            |        |
| Backup tag created       | Tag before deletion                        |        |

---

## 10. Risk Assessment

| Risk                           | Impact                           | Mitigation                                       |
| ------------------------------ | -------------------------------- | ------------------------------------------------ |
| Hidden dynamic registry usages | Runtime component not found      | Grep for `getComponent(` & ensure parity test    |
| Silent validator gaps          | Weaker data integrity            | Add unit tests for new validator facade          |
| Address parsing regressions    | Incorrect saved org/case records | Snapshot tests for string→object round trip      |
| Financial mapping missed       | Monetary data corruption         | Test legacy sample transformation before cut     |
| File service contract drift    | Reads/writes fail                | Interface test mocking underlying store          |
| Pages still in use by ops      | Lost workflow access             | Stakeholder confirmation + separate archive repo |

---

## 11. Suggested Migration Order

1. Introduce new registry + validator/formatter facades.
2. Port or wrap data hooks.
3. Port normalization utilities (address, IDs) + financial mapping.
4. Provide file service + toast/logger platform adapters.
5. Update all imports in new TS layer to use facades (no direct `src/services/*`).
6. Run test suite; add fixture tests for transformations.
7. Tag current state; remove `src/`.
8. Cleanup failing tests; finalize docs + changelog.

---

## 12. Recovery Procedure

If removal causes breakage:

```bash
git checkout <backup-tag> -- src/services/registry.js
# Repeat for any restored files
```

---

## 13. Notes

- Keep a minimal shim for migration functions if live legacy datasets still enter the system.
- Consider a deprecation notice in console one release before full removal if distributing
  externally.

---

**Snapshot Complete – 2025-09-17**
