# Nightingale CMS – Copilot Core Instructions (Concise)

Strict, minimal rule set Copilot must follow. Omit anything not required. Prefer correctness,
safety, repeatable patterns.

## 1. Project Snapshot

Type: React 18 browser‑loaded CMS (no bundler at runtime)  
Lang: ES6+ JS, HTML, Tailwind CSS  
Storage: JSON + localStorage (file based)  
Architecture: Two layers → UI (generic) / Business (domain)  
Testing: Jest + React Testing Library (jsdom)

## 2. Non‑Negotiable Rules

1. Modern React components: use JSX syntax with ES6 imports (`import React from 'react'`).
2. Legacy components: define `const e = window.React.createElement;` inside function (migration
   pending).
3. No global alias like `window.e`.
4. UI layer = presentational only (no domain logic, no data mutation).
5. Business layer composes UI components + domain rules only.
6. Provide graceful fallback or null if `!window.React` (legacy components only).
7. No side effects in render; use hooks properly.
8. All hooks called unconditionally at top level.
9. Avoid inline styles; use Tailwind utility classes.
10. Add loading / empty / error states for async or data-driven UI.
11. Do not introduce new globals—attach only via existing registries.

- Allowed diagnostics globals (read-only): `globalThis.NightingaleLogger`, `globalThis.fileService`.
- Do not add any other globals.

12. Add PropTypes validation for all component props.

## 3. Component Layering

Folders (current pattern name mapping may vary in repo):  
`components/ui/` → generic building blocks (Button, Modal, DataTable, SearchBar, Badge, Form inputs,
Stepper).  
`components/business/` → workflows (CaseCreationModal, PersonCreationModal, CaseDetailsView, etc.).

UI components: accept data via props; no service calls, no file I/O, no domain validation.  
Business components: may call services, apply validation, orchestrate modals, mutate data (through
services / callbacks).

## 4. Self‑Registration Pattern

Each modern component file ends with:

```jsx
import { registerComponent } from '../../services/registry';

// Component definition...

// Registration (choose appropriate registry)
registerComponent('ui', 'MyComponent', MyComponent); // UI components
// registerComponent('business', 'MyComponent', MyComponent); // Business components

export default MyComponent;
```

Legacy components use:

```javascript
if (typeof window !== 'undefined') {
  window.MyComponent = MyComponent; // backward compatibility
  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('MyComponent', MyComponent);
  }
  // or NightingaleBusiness for business components
}
```

Never register both UI and Business registries—choose the correct one.

Note: Window-level registries like `window.NightingaleUI`/`window.NightingaleBusiness` are
historical and being phased out. Prefer the ES module registry via `services/registry.js` in all new
code.

## 5. React Pattern Template

### Modern Pattern (Preferred)

```jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

function ExampleComponent({ value: initialValue = '', onChange, ...props }) {
  // Hooks (unconditional)
  const [value, setValue] = useState(initialValue);
  const derived = useMemo(() => value.trim(), [value]);
  const handleChange = useCallback(
    (ev) => {
      setValue(ev.target.value);
      onChange?.(ev.target.value);
    },
    [onChange],
  );

  return (
    <div
      className="p-4"
      {...props}
    >
      {derived}
    </div>
  );
}

ExampleComponent.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default ExampleComponent;
```

### Legacy Pattern (Migration Pending)

```javascript
function ExampleComponent(props) {
  if (!window.React) return null; // safety
  const e = window.React.createElement;
  const { useState, useEffect, useMemo, useCallback } = window.React;

  // Hooks (unconditional)
  const [value, setValue] = useState('');
  const derived = useMemo(() => value.trim(), [value]);
  const handleChange = useCallback((ev) => setValue(ev.target.value), []);

  return e('div', { className: 'p-4' }, derived);
}
```

## 6. Error Handling & Fallbacks

- Wrap major view roots with `ErrorBoundary` (class component allowed).
- Services or async calls: `try/catch` → log via `window.NightingaleLogger?.get(...).error(...)` and
  user feedback via `window.showToast(msg,'error')`.
- Defensive: null / undefined guards around external data before mapping.

## 7. Data & Validation

- Sanitize / validate via existing core utilities (`NightingaleCoreUtilities.*`, `Validators`).
- Never duplicate validator logic—reuse.
- Don’t mutate objects passed as props; create copies.

## 8. Testing Expectations

- New UI component: minimal tests (render, variants, disabled/loading, events).
- Business component: key workflow happy path + at least one error path.
- Use RTL queries by role / text; avoid implementation detail queries.
- Keep tests deterministic; mock services (file, logger, search) at setup level.

## 9. Commit Message Standard (Conventional Commits)

Format: `<type>(<scope>): <short>`  
Types: `feat|fix|refactor|test|docs|chore|style`  
Common scopes: `ui`, `business`, `services`, `tests`, `config`, `data`, `modals`, `components`,
`deps`.  
Examples:  
`feat(ui): add outline variant to Button`  
`fix(services): handle null ID in migration`  
`test(tests): add Modal accessibility tests`

No fluff, no status phrases, no “successfully”, no outcome commentary. Body only when needed for
context / breaking change note.

Note on workflow: This is a solo-dev repository. Do not open pull requests; changes are merged
directly (including force-push when appropriate). Keep commits atomic and follow Conventional
Commits.

## 10. Performance & Accessibility

- Use `useMemo`/`useCallback` only for measurable benefit (filtering large arrays, stable handlers
  passed deep).
- Avoid O(n) recomputation in render; pre-compute via memo.
- Add `aria-*` attrs to interactive / modal components; ensure focus trap or at minimum initial
  focus + ESC close.
- Provide keyboard activation for custom interactive elements.

## 11. Forbidden / Anti‑Patterns

- Global `e` alias.
- File-scope `const e = ...` reused across components.
- Business logic inside UI component.
- Direct DOM mutation except controlled, sanitized injection utility.
- Silent catch (must log or rethrow).
- Deep prop drilling for services—prefer passing explicit callbacks.
- Creating new validators inline instead of using the shared set.

## 12. When Unsure

Prefer: minimal, defensive, composable.  
If a requirement conflicts, default to preserving existing public API and patterns above. Surface
ambiguity rather than guessing.

---

This concise file replaces the expansive version. Add extended rationale or examples in separate
docs; keep this core under ~150 lines.
