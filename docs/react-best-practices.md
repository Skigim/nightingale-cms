# React Best Practices (Nightingale CMS)

Status: Living guideline. Authoritative enforcement rules live in `.github/copilot-instructions.md`.
This document complements those rules with rationale, examples, and practical patterns observed in
this codebase. Anything conflicting: defer to `copilot-instructions.md`.

## 1. Core Principles (Rationale Only)

We do not restate every rule—only why they matter here:

1. Pure Components: Deterministic output prevents subtle cascade bugs in tab workflows.
2. Immutable Data: Enables safe memo boundaries (DataTable rows, financial item lists).
3. Side‑Effects Segregation: Keeps service initialization (autosave, logging) predictable.
4. ID Normalization Early: Avoids repeated `ensureStringId` scattered across render paths.
5. Layer Separation: UI layer stays snapshot-compatible for later extraction (design system).

## 2. Hooks Usage – High Signal Patterns

Do (examples trimmed for clarity):

```jsx
// Stable initialization with closure for volatile data
useEffect(() => {
  const svc = new AutosaveFileService();
  svc.initialize({ fileService, dataProvider: () => fullData });
  setAutosaveService(svc);
}, [fileService]);
```

Avoid:

```jsx
// ❌ Recreates service on every data mutation
useEffect(() => {
  /* init */
}, [fullData]);
```

Decision heuristic: If the effect sets up a long‑lived resource, depend on its static inputs—not on
consumed mutable state that can be read through a closure.

## 3. Derived Data & Memo Boundaries

Only memo for: (a) expensive transforms, (b) stable referential props passed deep, (c) preventing
virtual list churn.

Guideline:

```jsx
const peopleIndex = useMemo(() => buildPeopleIndex(people), [people]);
```

Do NOT memo trivial string concatenations—prefer plain expressions.

## 4. Person Resolution Pattern (New)

Central utility (`personResolution.js`) prevents drift between list and detail views.

Flow:

1. Build index once per people array instance.
2. Resolve via index; fallback uses canonical finder.
3. Derive display name with explicit state transitions:
   - No assignment → "No Person Assigned"
   - Loading (people array not yet present) → "(loading…)"
   - Missing record (after load) → "Unlinked Person"
   - Valid → `person.name || first+last || clientName`
4. Emit diagnostics (warn once per case) for `missing_person_for_case`.

Benefits: O(1) lookup, unified naming semantics, deterministic logging.

## 5. Effects: Dependency Hygiene

Question to ask: "Will stale closure data cause an incorrect external interaction?" If yes, include
the dependency; if not, use a closure.

Checklist before excluding a value:

1. Is the value only read (not used to decide whether to recreate resource)?
2. Can the resource tolerate reading newer state lazily? (e.g., autosave snapshot)
3. Are we avoiding a thundering herd re-init?

If all yes → closure pattern is acceptable.

## 6. Naming & File Patterns

- UI components: `PascalCase.jsx`, PropTypes mandatory
- Business components: Must not re-export UI concerns or embed service logic inline if delegatable
- Service utilities: Verb-noun or domain-noun (e.g., `safeDataMerge`, `personResolution`)

## 7. Error & Diagnostic Logging

Use structured, low-noise logging:

```javascript
logger?.warn?.('missing_person_for_case', { caseId, personId, peopleCount });
```

Warn _once_ per entity; track with a ref `Set` when inside React lifecycle.

## 8. Accessibility & Interaction

Minimum bar:

- Interactive elements must have focus styles (Tailwind focus ring or underline)
- Modals: Initial focus and ESC close supported (or documented limitation)
- Non-text icons require `aria-label` or adjacent text

## 9. Performance Triage Order

1. Correctness first (pure, predictable renders)
2. Remove recomputation hot spots (indexes, filtered arrays)
3. Memo stable heavy props (datasets into grids)
4. Only then consider `React.memo` or splitting.

Anti-pattern: Blanket `useCallback` on every handler when handlers are cheap.

## 10. Common Pitfall Case Study – Autosave Loop

Problem: Effect depended on `fullData`, recreating service each mutation → compounding writes.

Before (loop risk):

```jsx
useEffect(() => {
  initAutosave(fullData);
}, [fullData]);
```

After (stable):

```jsx
useEffect(() => {
  initAutosave(() => fullData);
}, []);
```

Key Insight: Differentiate data needed _to construct_ a resource from data the resource only
_reads_.

## 11. When NOT to Abstract

Avoid premature shared hooks for simple one-off state pairs unless duplicated ≥3 times with the same
semantics (e.g., modal open flags). Clarity > dedup for low cognitive load state.

## 12. Reference Map (Single Sources)

| Concern                | Canonical Source                     |
| ---------------------- | ------------------------------------ |
| Enforced rules         | `.github/copilot-instructions.md`    |
| Component registration | `src/services/registry.js`           |
| Person resolution      | `src/services/personResolution.js`   |
| Data merge safety      | `src/services/safeDataMerge.js`      |
| Logging infrastructure | `src/services/nightingale.logger.js` |

## 13. Adoption Checklist (New/Refactored Component)

Before merging:

1. Pure render (no side-effects)
2. PropTypes defined
3. Layer compliance (UI vs Business)
4. Uses shared person resolution if showing person data
5. No redundant memos/callbacks
6. Accessibility basics (labels / focus)
7. Deterministic tests (if new behavior)

## 14. Future Improvements

- Formalize modal accessibility pattern (focus trapping util)
- Lightweight performance lint (detect broad deps in effects)
- Codemod to migrate remaining legacy `React.createElement` components

---

Questions or proposed guideline changes: open an issue or add note in upcoming CHANGELOG section.
