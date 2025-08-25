# React Best Practices for Nightingale CMS

_Based on React.dev official documentation and Rules of React_
_Last Updated: August 16, 2025_

## 🎯 **Overview**

This document outlines React best practices specifically for the Nightingale CMS project, based on the official Rules of React from r- [ ] Form data validation happens before submission

## 🧩 **React DOM Components**

React supports ## 🌐 **React DOM APIs (Web Browser Applications)**

React DOM provides APIs specifically for web browser environments, handling browser-specific functionality. browser built-in HTML and SVG components with React-specific enhancements and conventions.

### **Component Categories**

#### **Common Components**

All built-in browser components (like `<div>`, `<span>`, `<section>`) support React-specific props:

- `ref` - For direct DOM access
- `dangerouslySetInnerHTML` - For setting HTML content (use with extreme caution)
- `key` - For lis## 🌐 **React DOM Hooks (Web Browser Applications)**

React DOM provides specialized hooks for handling form interactions in **web browser environments only**.

### **useFormStatus Hook**

**Purpose**: Provides status information about the last form submission, enabling better user experience during async form operations.

**Returns**:

- `pending`: Boolean indicating if form is currently submitting
- `data`: FormData object containing submission data (null if no active submission)
- `method`: String value of 'get' or 'post' indicating HTTP method
- `action`: Reference to the form's action function

**Critical Rules**:

1. **Must be called from within a `<form>` component** - cannot be used in the same component that renders the form
2. **Only tracks parent `<form>`** - will not track forms rendered in the same component or child components
3. **Web browser only** - this is a React DOM feature for web applications- All standard HTML attributes with camelCase naming

#### **Form Components (Special Behavior)**

These components have special React handling when used with the `value` prop:

- `<input>` - Becomes controlled when `value` prop is provided
- `<select>` - Becomes controlled when `value` prop is provided
- `<textarea>` - Becomes controlled when `value` prop is provided

**Controlled vs Uncontrolled**:

```javascript
// ✅ Controlled - React manages the value
function ControlledInput() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}

// ✅ Uncontrolled - DOM manages the value
function UncontrolledInput() {
  const ref = useRef();
  return <input ref={ref} defaultValue="initial" />;
}

// ❌ Mixed - Don't do this
function BadInput() {
  return <input value="fixed" />; // No onChange handler - will be read-only
}
```

#### **Resource and Metadata Components**

Special components that React can render into document head:

- `<link>` - For stylesheets and resources
- `<meta>` - For metadata
- `<script>` - For external scripts
- `<style>` - For inline styles
- `<title>` - For document title

React can suspend while these resources load and handles special behaviors.

### **React-Specific Naming Conventions**

#### **HTML Attributes to camelCase**

```javascript
// ❌ HTML naming
<div tabindex="0" class="container" for="input-id">

// ✅ React naming
<div tabIndex="0" className="container" htmlFor="input-id">
```

#### **SVG Attributes to camelCase**

```javascript
// ❌ SVG naming
<svg xmlns:xlink="http://www.w3.org/1999/xlink">
  <use xlink:href="#icon" />
</svg>

// ✅ React naming
<svg xmlnsXlink="http://www.w3.org/1999/xlink">
  <use xlinkHref="#icon" />
</svg>
```

### **Custom Elements**

#### **Web Components Support**

```javascript
// ✅ Custom elements with dash
<my-custom-element class="styled" for="element">
  Custom content
</my-custom-element>

// Note: Custom elements use 'class' and 'for', not 'className' and 'htmlFor'
```

### **Nightingale CMS Component Guidelines**

#### **Form Component Patterns**

1. **Always use controlled components** for form inputs in modals and settings
2. **Provide proper labels** using `htmlFor` and `id` attributes
3. **Handle validation** with proper error state management
4. **Use semantic HTML** - prefer `<button>` over `<div>` for clickable elements

#### **Component Structure Best Practices**

```javascript
// ✅ Good structure with proper semantics
function CaseForm({ caseData, onUpdate }) {
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Case Information</legend>

        <label htmlFor="mcn">MCN:</label>
        <input
          id="mcn"
          type="text"
          value={caseData.mcn}
          onChange={(e) => onUpdate('mcn', e.target.value)}
          required
        />

        <button type="submit">Save Case</button>
      </fieldset>
    </form>
  );
}
```

#### **Accessibility Requirements**

- [ ] All form inputs have associated labels (`<label htmlFor="id">`)
- [ ] Buttons have descriptive text or `aria-label`
- [ ] Interactive elements are keyboard accessible
- [ ] Form validation errors are announced to screen readers
- [ ] Semantic HTML structure (`<main>`, `<section>`, `<header>`, etc.)

#### **Performance Considerations**

- [ ] Use `key` prop for dynamic lists to help React reconciliation
- [ ] Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- [ ] Prefer controlled components for form state management
- [ ] Use semantic HTML to avoid unnecessary custom components

## 🛠️ **React API Overview & Best Practices**

A comprehensive guide to all React features and their proper usage in Nightingale CMS.

### **📊 Built-in React Hooks**

#### **State Hooks** (Managing Component Memory)

```javascript
// ✅ useState - For simple state
const [caseData, setCaseData] = useState(getInitialCaseData());

// ✅ useReducer - For complex state logic
const [state, dispatch] = useReducer(caseReducer, initialState);
```

**When to Use Each:**

- `useState`: Simple values, independent state updates
- `useReducer`: Complex state with multiple sub-values, state transitions

#### **Context Hooks** (Sharing Data Without Props)

```javascript
// ✅ Create context for app-wide data
const NightingaleContext = createContext();

// ✅ Consume context in components
function CaseModal() {
  const { currentUser, permissions } = useContext(NightingaleContext);
  // ...
}
```

**Best for**: User authentication, theme, app configuration, permissions

#### **Ref Hooks** (Direct DOM Access)

```javascript
// ✅ useRef - For DOM nodes and persistent values
const inputRef = useRef(null);
const intervalRef = useRef(null);

// ✅ useImperativeHandle - Rarely needed
const MyInput = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current.focus() }));
});
```

**Use Cases**: Focus management, scroll positions, third-party library integration

#### **Effect Hooks** (Synchronizing with External Systems)

```javascript
// ✅ useEffect - Main effect hook
useEffect(() => {
  const subscription = api.subscribe(caseId, handleUpdate);
  return () => subscription.unsubscribe(); // Cleanup
}, [caseId]); // Dependencies

// ✅ useLayoutEffect - For DOM measurements (rare)
useLayoutEffect(() => {
  const height = ref.current.getBoundingClientRect().height;
  setHeight(height);
}, []);
```

**Critical Rules:**

- Always include cleanup functions for subscriptions
- Include all dependencies in dependency array
- Don't use Effects for data flow orchestration

#### **Performance Hooks** (Optimization)

```javascript
// ✅ useMemo - Cache expensive calculations
const filteredCases = useMemo(
  () => cases.filter((c) => c.status === filter),
  [cases, filter]
);

// ✅ useCallback - Cache function definitions
const handleSubmit = useCallback(
  (data) => {
    onSubmit(data);
  },
  [onSubmit]
);

// ✅ useTransition - Non-blocking updates
const [isPending, startTransition] = useTransition();
const handleSearch = (query) => {
  startTransition(() => setSearchQuery(query));
};
```

**When to Optimize:**

- Only optimize when you have performance problems
- Measure before and after optimization
- Consider React.memo for expensive components

#### **Utility Hooks**

```javascript
// ✅ useId - Unique IDs for accessibility
const id = useId();
return (
  <>
    <label htmlFor={id}>Name</label>
    <input id={id} />
  </>
);

// ✅ useDebugValue - Custom hook debugging
function useLocalStorage(key) {
  useDebugValue(`localStorage: ${key}`);
  // ...
}
```

### **🧩 Built-in React Components**

#### **Fragment** (`<>` or `<Fragment>`)

```javascript
// ✅ Group elements without extra DOM nodes
return (
  <>
    <Header />
    <MainContent />
    <Footer />
  </>
);

// ✅ With key for lists
{
  items.map((item) => (
    <Fragment key={item.id}>
      <dt>{item.term}</dt>
      <dd>{item.definition}</dd>
    </Fragment>
  ));
}
```

#### **StrictMode** (Development Safety)

```javascript
// ✅ Wrap your app for extra checks
root.render(
  <StrictMode>
    <ErrorBoundary>
      <NightingaleCMSApp />
    </ErrorBoundary>
  </StrictMode>
);
```

**Benefits**: Double-invokes effects, warns about deprecated APIs, detects side effects

#### **Suspense** (Loading States)

```javascript
// ✅ Handle async component loading
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

#### **Profiler** (Performance Monitoring)

```javascript
// ✅ Measure component performance
<Profiler id="CaseCreationModal" onRender={onRenderCallback}>
  <CaseCreationModal />
</Profiler>
```

### **🔧 React APIs**

#### **Context Management**

```javascript
// ✅ Create context for shared state
const NightingaleContext = createContext({
  user: null,
  cases: [],
  updateCase: () => {},
});
```

#### **Component Optimization**

```javascript
// ✅ React.memo - Prevent unnecessary re-renders
const CaseCard = memo(({ caseData, onClick }) => {
  return <div onClick={onClick}>{caseData.title}</div>;
});

// ✅ React.lazy - Code splitting
const CaseReports = lazy(() => import('./CaseReports'));
```

#### **State Transitions**

```javascript
// ✅ startTransition - Mark non-urgent updates
import { startTransition } from 'react';

function handleSearch(query) {
  startTransition(() => {
    setSearchResults(search(query));
  });
}
```

### **🎯 Nightingale CMS Implementation Guidelines**

#### **State Management Strategy**

1. **Local State**: `useState` for component-specific data
2. **Complex State**: `useReducer` for case creation workflow
3. **Global State**: Context for user, permissions, app settings
4. **Performance**: `useMemo`/`useCallback` only when measured performance issues

#### **Component Architecture**

```javascript
// ✅ Recommended structure
function CaseCreationModal({ isOpen, onClose }) {
  // 1. Hooks at the top
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useContext(NightingaleContext);

  // 2. Derived state
  const canProceed = useMemo(() => validateStep(currentStep), [currentStep]);

  // 3. Event handlers
  const handleNext = useCallback(() => {
    if (canProceed) setCurrentStep((prev) => prev + 1);
  }, [canProceed]);

  // 4. Effects
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // 5. Render
  return <StepperModal>{/* JSX */}</StepperModal>;
}
```

#### **Error Handling Strategy**

```javascript
// ✅ Combine ErrorBoundary with Suspense
<ErrorBoundary>
  <Suspense fallback={<LoadingSpinner />}>
    <CaseCreationModal />
  </Suspense>
</ErrorBoundary>
```

#### **Performance Checklist**

- [ ] Use React.StrictMode in development
- [ ] Implement ErrorBoundary for all major features
- [ ] Use Suspense for code-split components
- [ ] Only optimize with useMemo/useCallback when performance issues are measured
- [ ] Use React.memo for expensive list items
- [ ] Implement proper cleanup in useEffect

## � **React DOM APIs (Web-Specific)**

React DOM provides APIs specifically for web browser environments. These are distinct from React Native and handle browser-specific functionality.

### **🔧 Core React DOM APIs**

#### **createPortal** (Advanced DOM Rendering)

```javascript
// ✅ Render modals outside component hierarchy
import { createPortal } from 'react-dom';

function Modal({ children, isOpen }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.getElementById('modal-root') // Render outside main app
  );
}
```

**Use Cases for Nightingale CMS:**

- Modal dialogs (case creation, settings)
- Tooltip overlays
- Dropdown menus that need to escape container boundaries
- Toast notifications

#### **flushSync** (Force Synchronous Updates)

```javascript
// ⚠️ Use sparingly - forces synchronous DOM updates
import { flushSync } from 'react-dom';

function handleSubmit() {
  flushSync(() => {
    setSubmitting(true);
  });
  // DOM is guaranteed to be updated here
  document.getElementById('submit-button').focus();
}
```

**When to Use:**

- Integrating with third-party DOM libraries
- Ensuring DOM updates before measurements
- **Rarely needed** - React's concurrent updates are usually better

### **🚀 Client APIs (Application Initialization)**

#### **createRoot** (Modern React 18+ Pattern)

```javascript
// ✅ Modern React 18+ initialization
import { createRoot } from 'react-dom/client';

const container = document.getElementById('app');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <NightingaleCMSApp />
    </ErrorBoundary>
  </React.StrictMode>
);

// ✅ Proper cleanup
// root.unmount(); // When needed
```

#### **hydrateRoot** (Server-Side Rendering)

```javascript
// ✅ For SSR applications (if you migrate later)
import { hydrateRoot } from 'react-dom/client';

const container = document.getElementById('app');
hydrateRoot(container, <NightingaleCMSApp />);
```

**Note**: Your current setup uses Babel in-browser, so you're using client-side rendering

### **⚡ Resource Preloading APIs**

React DOM provides APIs for performance optimization through resource preloading:

```javascript
// ✅ Preload critical resources
import { preload, preinit } from 'react-dom';

// Preload assets
preload('/fonts/nightingale-icons.woff2', { as: 'font', type: 'font/woff2' });
preload('/api/cases/recent', { as: 'fetch' });

// Load and execute scripts
preinit('/js/third-party-charts.js', { as: 'script' });
```

**Performance Benefits:**

- Faster page loads
- Reduced loading spinners
- Better user experience

### **🎯 Nightingale CMS Implementation Guidelines**

#### **Modal Architecture with Portals**

```javascript
// ✅ Recommended modal pattern
function CaseCreationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <StepperModal onClose={onClose}>{/* Modal content */}</StepperModal>
      </div>
    </div>,
    document.body // Render at body level
  );
}
```

#### **Application Initialization Best Practices**

```javascript
// ✅ Recommended app initialization
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('nightingale-app');
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <NightingaleCMSApp />
      </ErrorBoundary>
    </StrictMode>
  );
});
```

#### **Performance Optimization Strategy**

```javascript
// ✅ Preload critical CMS resources
function initializeApp() {
  // Preload user permissions
  preload('/api/user/permissions', { as: 'fetch' });

  // Preload recent cases
  preload('/api/cases/recent', { as: 'fetch' });

  // Load charts library if user has reporting access
  if (userHasReportingAccess) {
    preinit('/js/charts.min.js', { as: 'script' });
  }
}
```

### **🔄 Migration from Legacy APIs**

Your current setup may use older patterns. Here's the modern equivalent:

```javascript
// ❌ Legacy React 17 pattern
ReactDOM.render(<App />, document.getElementById('app'));

// ✅ Modern React 18+ pattern
const root = createRoot(document.getElementById('app'));
root.render(<App />);
```

### **📋 React DOM Checklist**

- [ ] Use `createPortal` for all modal dialogs
- [ ] Initialize app with `createRoot` instead of legacy `ReactDOM.render`
- [ ] Implement proper root cleanup for SPA navigation
- [ ] Consider resource preloading for performance-critical assets
- [ ] Use `flushSync` only when absolutely necessary
- [ ] Ensure modal accessibility with proper focus management
- [ ] Test portal rendering across different browsers

## �🎯 **Next Steps**t.dev. These are **rules, not just guidelines** - breaking them leads to bugs and hard-to-maintain code.

## 📋 **Core Rules of React**

### **1. Components and Hooks Must Be Pure**

#### **1.1 Components Must Be Idempotent**

- **Rule**: Components should always return the same output for the same inputs (props, state, context)
- **Current Status**: ✅ Most Nightingale components follow this
- **Action Items**:
  - Review all components for side effects in render
  - Ensure no random values or Date.now() in render methods

```javascript
// ❌ BAD - Not idempotent
function CaseList({ cases }) {
  const timestamp = Date.now(); // Different every render!
  return <div>Cases loaded at: {timestamp}</div>;
}

// ✅ GOOD - Idempotent
function CaseList({ cases }) {
  return <div>Total cases: {cases.length}</div>;
}
```

#### **1.2 Side Effects Must Run Outside of Render**

- **Rule**: No side effects in component render methods
- **Current Issues**: Need to audit Nightingale components for:
  - API calls in render
  - Console.log statements
  - Local storage access
  - DOM manipulation

```javascript
// ❌ BAD - Side effect in render
function Dashboard() {
  console.log('Rendering dashboard'); // Side effect!
  localStorage.setItem('lastPage', 'dashboard'); // Side effect!
  return <div>Dashboard</div>;
}

// ✅ GOOD - Side effects in useEffect
function Dashboard() {
  useEffect(() => {
    console.log('Dashboard mounted');
    localStorage.setItem('lastPage', 'dashboard');
  }, []);
  return <div>Dashboard</div>;
}
```

#### **1.3 Props and State Are Immutable**

- **Rule**: Never mutate props or state directly
- **Current Issues**: Check all Nightingale components for direct mutations

```javascript
// ❌ BAD - Direct mutation
function updateCase(caseData) {
  caseData.status = 'updated'; // Mutating prop!
  return caseData;
}

// ✅ GOOD - Immutable update
function updateCase(caseData) {
  return { ...caseData, status: 'updated' };
}
```

#### **1.4 Values Are Immutable After Being Passed to JSX**

- **Rule**: Don't mutate values after they've been used in JSX

```javascript
// ❌ BAD
function CaseForm({ initialData }) {
  const formData = initialData;
  const element = <input value={formData.name} />;
  formData.name = 'modified'; // Mutating after JSX creation!
  return element;
}

// ✅ GOOD
function CaseForm({ initialData }) {
  const formData = { ...initialData, name: 'modified' };
  return <input value={formData.name} />;
}
```

### **2. React Calls Components and Hooks**

#### **2.1 Never Call Component Functions Directly**

- **Rule**: Components should only be used in JSX, not called as functions
- **Current Issues**: Check Nightingale codebase for direct component calls

```javascript
// ❌ BAD - Direct function call
function App() {
  const sidebar = Sidebar({ activeTab: 'dashboard' }); // Wrong!
  return <div>{sidebar}</div>;
}

// ✅ GOOD - JSX usage
function App() {
  return (
    <div>
      <Sidebar activeTab="dashboard" />
    </div>
  );
}
```

#### **2.2 Never Pass Around Hooks as Regular Values**

- **Rule**: Hooks should only be called inside components
- **Current Status**: ✅ Nightingale appears to follow this correctly

### **3. Rules of Hooks**

#### **3.1 Only Call Hooks at the Top Level**

- **Rule**: No hooks inside loops, conditions, or nested functions
- **Action Items**: Audit all Nightingale components for hook violations

```javascript
// ❌ BAD - Conditional hook
function CaseDetails({ caseId }) {
  if (caseId) {
    const [caseData, setCaseData] = useState(null); // Wrong!
  }
  return <div>Case</div>;
}

// ✅ GOOD - Hook at top level
function CaseDetails({ caseId }) {
  const [caseData, setCaseData] = useState(null);

  if (!caseId) {
    return <div>No case ID</div>;
  }

  return <div>Case: {caseData?.name}</div>;
}
```

#### **3.2 Only Call Hooks from React Functions**

- **Rule**: Only call hooks from components or custom hooks
- **Current Status**: ✅ Nightingale follows this correctly

## 🔧 **Nightingale CMS Specific Issues to Address**

### **Critical Issues Found**

1. **Component Namespace Timing** (✅ Recently Fixed)
   - Issue: Components undefined when referenced
   - Solution: Proper build order and error boundaries

2. **Error Boundary Implementation** (✅ Recently Added)
   - Added ErrorBoundary component following React best practices
   - Catches rendering errors gracefully

3. **Bundle Architecture** (⚠️ Needs Review)
   - Custom bundling system needs audit for React compliance
   - Consider migrating to standard tools (Vite, Webpack)

### **Audit Checklist**

#### **Component Purity Audit**

- [ ] Review all components for side effects in render
- [ ] Check for direct prop/state mutations
- [ ] Verify no API calls in render methods
- [ ] Remove console.log from render methods

#### **Hook Usage Audit**

- [ ] Verify all hooks are at component top level
- [ ] Check for conditional hook calls
- [ ] Ensure hooks only in React functions

#### **JSX Best Practices**

- [ ] No direct component function calls
- [ ] Proper key props for lists
- [ ] No mutation after JSX creation

## 🛡️ **Recommended Tools**

### **ESLint Configuration**

Add to your project to automatically catch Rule violations:

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### **React Strict Mode**

Already recommended in React docs - add to your app:

```javascript
// In your main app initialization
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <NightingaleCMSApp />
    </ErrorBoundary>
  </React.StrictMode>
);
```

## 📈 **Performance Best Practices**

1. **Use React.memo** for expensive components
2. **useMemo** for expensive calculations
3. **useCallback** for stable function references
4. **Lazy loading** for large components

## � **React DOM Hooks (Web-Specific)**

React DOM provides specialized hooks for handling form interactions in web applications. These hooks are NOT available for React Native or other non-web environments.

### **useFormStatus Hook**

**Purpose**: Provides status information about the last form submission, enabling better user experience during async form operations.

**Returns**:

- `pending`: Boolean indicating if form is currently submitting
- `data`: FormData object containing submission data (null if no active submission)
- `method`: String value of 'get' or 'post' indicating HTTP method
- `action`: Reference to the form's action function

**Critical Rules**:

1. **Must be called from within a `<form>` component** - cannot be used in the same component that renders the form
2. **Only tracks parent `<form>`** - will not track forms rendered in the same component or child components
3. **Web-only hook** - not available for mobile/desktop React applications

**Best Practice Pattern**:

```javascript
function SubmitButton() {
  const { pending, data } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

function MyForm({ action }) {
  return (
    <form action={action}>
      <input name="username" type="text" />
      <SubmitButton /> {/* useFormStatus works here */}
    </form>
  );
}
```

**Common Pitfalls**:

```javascript
// ❌ WRONG - useFormStatus in same component as form
function MyForm() {
  const { pending } = useFormStatus(); // Will never return true
  return <form action={submit}>...</form>;
}

// ✅ CORRECT - useFormStatus in child component
function SubmitButton() {
  const { pending } = useFormStatus(); // Works correctly
  return <button disabled={pending}>Submit</button>;
}
```

### **Nightingale CMS Form Guidelines**

1. **Use for all async form submissions** - especially modal forms and settings
2. **Provide visual feedback** - disable buttons and show loading states during submission
3. **Display submission data** - show users what they're submitting for confirmation
4. **Error boundary integration** - combine with ErrorBoundary for robust form handling
5. **Consistent UX patterns** - standardize loading states across all forms

### **Form State Management Checklist**

- [ ] Form submission buttons use `useFormStatus` for pending states
- [ ] Loading indicators appear during form submission
- [ ] Form inputs are disabled during submission to prevent double-submission
- [ ] Error states are handled gracefully with ErrorBoundary
- [ ] Success states provide clear feedback to users
- [ ] Form data validation happens before submission

## �🎯 **Next Steps**

1. **Immediate (This Week)**:
   - [ ] Add ESLint with React rules
   - [ ] Enable React Strict Mode
   - [ ] Audit top 5 most complex components

2. **Short Term (Next 2 Weeks)**:
   - [ ] Complete component purity audit
   - [ ] Fix any Rule violations found
   - [ ] Add unit tests for critical components

3. **Long Term (Next Month)**:
   - [ ] Consider migration to modern build tools
   - [ ] Implement performance optimizations
   - [ ] Add comprehensive testing suite

## 📚 **References**

- [React Rules of React](https://react.dev/reference/rules)
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [React Strict Mode](https://react.dev/reference/react/StrictMode)
- [ESLint React Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)

---

_This document should be updated as React best practices evolve and as the Nightingale CMS project grows._
