# React Best Practices for Nightingale CMS

Last Updated: August 25, 2025
Part 1: Core Principles of React
This section covers the foundational rules and mental models for writing reliable and
maintainable React code. These are rules, not just guidelines —breaking them often leads to
bugs. Adhering to these principles enables React's performance optimizations and is essential
for the patterns we'll explore in Parts 2-4.
1.1. Overview
This document outlines React best practices specifically for the Nightingale CMS project,
based on the official React documentation. Our goal is to ensure our codebase is consistent,
performant, and easy to maintain.
1.2. The Rules of React
At its core, React is designed around a few key principles:
● Components must be pure functions.
● Props and state are immutable.
● React manages the render cycle.
Components Must Be Pure Functions
Your components should be idempotent: for the same inputs (props, state, context), they must
always return the same JSX. This means avoiding side effects during the render phase. A
component's job is to calculate and return JSX, not to modify external variables, make API
calls, or write to localStorage directly within its body. All side effects must be handled within
useEffect or event handlers.
//
❌
BAD: Side effect in render
function Dashboard() {
localStorage.setItem('lastPage', 'dashboard'); // This is a side effect!
return <div>Dashboard</div>;
}
//
✅
GOOD: Side effect moved to an Effect
function Dashboard() {
useEffect(() => {
localStorage.setItem('lastPage', 'dashboard');
}, []);
return <div>Dashboard</div>;
}
Props and State Are Immutable
You must never mutate props or state directly. Treat them as read-only snapshots. To update
state, always use the state setter function to create a new object or array.
//
❌
BAD: Direct mutation of a prop
function updateCase(caseData) {
caseData.status = 'updated'; // Mutating a prop is forbidden!
return caseData;
}
//
✅
GOOD: Immutable update pattern
function updateCase(caseData) {
return { ...caseData, status: 'updated' }; // Return a new object
}
React Manages the Render Cycle
You should never call your component functions directly. Instead, let React orchestrate when
and how to render them by using JSX.
//
❌
BAD: Calling a component like a regular function
function App() {
const sidebar = Sidebar({ activeTab: 'dashboard' }); // Wrong!
return <div>{sidebar}</div>;
}
//
✅
GOOD: Using JSX to let React render the component
function App() {
return (

<div>
<Sidebar activeTab="dashboard" />
</div>
);
}
1.3. The Rules of Hooks
Hooks have strict rules to ensure they work correctly.
Only Call Hooks at the Top Level
Never call Hooks inside loops, conditions, or nested functions. Hooks must be called in the
same order on every render, and placing them inside a condition would violate this.
//
❌
 BAD: Conditional Hook call
function CaseDetails({ caseId }) {
if (caseId) {
const [caseData, setCaseData] = useState(null); // Violates the rule!
}
// ...
}
//
✅
 GOOD: Hook is at the top level
function CaseDetails({ caseId }) {
const [caseData, setCaseData] = useState(null);
if (!caseId) {
return <div>No case selected</div>;
}
// ...
}
Only Call Hooks from React Functions
You can only call Hooks from within React function components or from your own custom
Hooks. You cannot call them from regular JavaScript functions.
//
❌
 BAD: Hook in a regular JavaScript function
function processData() {
const [data, setData] = useState(null); // This will not work!
}
//
✅
 GOOD: Hook in a component or a custom hook
function useDataProcessor() {
const [data, setData] = useState(null);
// ...
return data;
}
Part 2: Core React API Reference
A reference guide for the APIs provided by the core react package, available on all platforms.
2.1. Built-in Hooks
Hooks let you use state and other React features in functional components.
●  State Hooks  : For managing component memory and state.
○  useState: For simple, independent state values.
const [caseData, setCaseData] = useState(getInitialCaseData());
○  useReducer: For complex state logic with multiple sub-values or well-defined state
transitions.
const [state, dispatch] = useReducer(caseReducer, initialState);
●  Context Hooks  : For sharing data through the component  tree without prop drilling.
○  useContext: Subscribes a component to a context, providing access to its value.
const { currentUser } = useContext(NightingaleContext);
●  Ref Hooks  : For accessing DOM nodes or holding mutable  values that don't trigger
re-renders.
○  useRef: Returns a mutable ref object. Commonly used for DOM access or persisting
values across renders.
const inputRef = useRef(null);
○  useImperativeHandle: Customizes the instance value that is exposed to parent
components when using ref. (Rarely needed).
●  Effect Hooks  : For synchronizing a component with an  external system (e.g., APIs,
subscriptions, timers). Always include all dependencies to prevent bugs.
○  useEffect: The primary hook for side effects. Runs after every render unless
dependencies are specified.
useEffect(() => {
const subscription = api.subscribe(caseId, handleUpdate);
return () => subscription.unsubscribe(); // Cleanup function
}, [caseId]); // Dependency array
○  useLayoutEffect: Runs synchronously after all DOM mutations. Use for reading layout
from the DOM and synchronously re-rendering. (Rare).
●  Performance Hooks  : For optimizing render performance.  See Part 4.4 for strategies on
when to apply these hooks.
○  useMemo: Caches the result of an expensive calculation.
const filteredCases = useMemo(() => filterCases(cases, filter), [cases, filter]);
○  useCallback: Caches a function definition, preventing it from being recreated on
every render.
const handleSubmit = useCallback(() => onSubmit(data), [onSubmit, data]);
○  useTransition: Marks state updates as non-urgent, allowing other updates to remain
responsive.
const [isPending, startTransition] = useTransition();
●  Other Hooks  :
○  useId: Generates unique, stable IDs for accessibility attributes.
const id = useId();
<label htmlFor={id}>Name</label>
<input id={id} type="text" />
○  useDebugValue: Displays a label for custom hooks in React DevTools.
2.2. Built-in Components
●  <Fragment> (<>...</>)  : Lets you group a list of children  without adding extra nodes to the
DOM.
●  <Suspense>  : Lets you display a fallback UI (like a  spinner) while its children are loading
(e.g., with React.lazy).
●  <StrictMode>  : A development tool that highlights potential  problems in an application.
●  <Profiler>  : Measures rendering performance of a React  tree to identify bottlenecks.
2.3. Other Core APIs
●  createContext  : Creates a Context object for sharing  data.
●  React.memo  : A higher-order component that memoizes  a component, preventing
re-renders if its props haven't changed.
const CaseCard = React.memo(({ caseData }) => {
return <div>{caseData.title}</div>;
});
●  React.lazy  : Lets you define a component that is loaded  dynamically (code-splitting).
●  startTransition  : A standalone version of the useTransition  hook's function, for use
outside of components.
Part 3: React DOM API Reference (Web-Specific)
A reference for APIs provided by the react-dom package, for use in browser environments
only.
3.1. DOM Rendering & Portals
●  Application Root: createRoot & hydrateRoot
The modern (React 18+) way to initialize a client-rendered application. Use createRoot for
all new apps. hydrateRoot is for server-side rendering.
Note: To migrate from the legacy ReactDOM.render, you will switch to using createRoot.
import { createRoot } from 'react-dom/client';
const container = document.getElementById('app');
const root = createRoot(container);
root.render(<NightingaleCMSApp />);
●  Rendering Outside the Root: createPortal
Renders a component into a different part of the DOM. Essential for modals, tooltips, and
notifications.
import { createPortal } from 'react-dom';
function Modal({ children }) {
return createPortal(
<div className="modal-overlay">{children}</div>,
document.body
);
}
●  Forcing Synchronous Updates: flushSync
⚠
 Use sparingly. Forces a synchronous DOM update. Rarely needed.
3.2. Built-in Browser Components
●  Common Components & Props  : Standard HTML elements  (<div>, <span>) support
special React props like ref, key, and dangerouslySetInnerHTML.
●  Form Components  : <input>, <select>, and <textarea>  become  controlled components
when given a value prop, meaning React state is the source of truth.
//
✅
 Controlled: React state drives the value.
function ControlledInput() {
const [value, setValue] = useState('');
return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
●  Resource & Metadata Components  : React can render <link>,  <meta>, <script>, etc., into
the document <head>.
●  Attribute Naming Conventions  : JSX uses  camelCase  for  most HTML/SVG attributes
(className, htmlFor, tabIndex, xlinkHref).
●  Custom Elements / Web Components  : Supported, but they  use standard HTML
attributes (class), not React's camelCase versions.
3.3. DOM Hooks
●  useFormStatus  : Provides status about a parent <form>'s  submission. Must be called
from a component inside the <form>.
function SubmitButton() {
const { pending } = useFormStatus();
return <button type="submit" disabled={pending}>{pending ? 'Submitting...' :
'Submit'}</button>;
}
●  useFormState  : Manages form state, especially for server  actions, to update the UI based
on the submission result.
3.4. Resource Preloading APIs
●  preload(href, options)  : Tells the browser to start  downloading a resource that will be
needed soon.
●  preinit(href, options)  : Tells the browser to download  and execute a resource, like a
script or stylesheet.
Part 4: Nightingale CMS Guidelines & Best Practices
Project-specific rules, patterns, and checklists for building the Nightingale CMS application.
4.1. Project Setup & Tooling
●  ESLint Configuration  : Enforce the Rules of React automatically.
{
"extends": ["eslint:recommended", "plugin:react/recommended",
"plugin:react-hooks/recommended"],
"rules": {
"react-hooks/rules-of-hooks": "error",
"react-hooks/exhaustive-deps": "warn"
}
}
●  Enabling StrictMode  : Wrap the application root in  <React.StrictMode> to enable extra
development-only checks.
●  Error Boundary Implementation  : Wrap major UI features  in an ErrorBoundary to prevent
a crash in one part of the UI from taking down the entire application.
●  Bundle Architecture Review  : A review is needed to  align our custom bundling system
with modern standards (e.g., Vite, Webpack).
4.2. Architecture & Component Patterns
●  Two-Layer Component Architecture
○  UI Layer (js/components/ui/)  : Generic, reusable components  (Button, Input, Modal).
They are presentation-focused and framework-agnostic.
○  Business Layer (js/components/business/)  : Components  with Nightingale CMS
domain logic. They compose UI components and manage application state.
●  State Management Strategy
○  Local State (useState)  : For component-specific UI  state (e.g., if a dropdown is
open).
○  Complex State (useReducer)  : For state with complex  logic (e.g., a multi-step form).
○  Global State (useContext)  : For app-wide data like  user authentication, permissions,
or theme settings.
●  Component Structure  : Organize components in this order  for readability:
function CaseCreationModal({ isOpen, onClose }) {
// 1. Hooks (useState, useContext, etc.)
// 2. Derived state (useMemo)
// 3. Event handlers (useCallback)
// 4. Effects (useEffect)
// 5. Return JSX
return <StepperModal>{/* ... */}</StepperModal>;
}
●  Form Component Patterns  : Always use controlled components  with accessible labels
(htmlFor/id).
●  Modal Architecture with Portals  : All modals, tooltips,  and dropdowns must use
createPortal.
function CaseCreationModal({ isOpen, onClose }) {
if (!isOpen) return null;
return createPortal(<ModalContent />, document.body);
}
4.3. Accessibility (A11y) Requirements
●  All form inputs must have an associated <label>.
●  All interactive elements must be keyboard-accessible with a clear focus state.
●  Buttons must have descriptive text or an aria-label.
●  Use semantic HTML (<main>, <nav>, <section>).
4.4. Performance Strategy
●  Measure First  : Use the React Profiler to identify  bottlenecks before optimizing.
●  When to Use Performance Hooks  :
○  useMemo: For expensive calculations that are re-run on every render.
○  useCallback: To prevent child components from re-rendering when passed a function
prop.
○  React.memo: Wrap components that are expensive to render and often receive the
same props.
●  Code Splitting  : Use React.lazy and <Suspense> to load  large components on demand.
4.5. Project Audit Checklists
●  Component Purity Audit
○  [ ] No side effects in render logic.
○  [ ] No direct mutation of props or state.
●  Hook Usage Audit
○  [ ] Hooks are only called at the top level.
○  [ ] Hooks are not called inside conditions or loops.
●  Form State Management Checklist
○  [ ] Submission buttons use useFormStatus to show a pending state.
○  [ ] Inputs are disabled during submission.
○  [ ] Validation errors are clearly displayed.
4.6. Action Plan & Next Steps
●  Immediate (This Week)  :
○  [ ] Add ESLint with React rules to all projects.
○  [ ] Enable React.StrictMode globally.
●  Short Term (Next 2 Weeks)  :
○  [ ] Complete the component purity and hook usage audits.
○  [ ] Refactor any components that violate the core rules.
●  Long Term (Next Month)  :
○  [ ] Plan the migration to a modern build tool.
○  [ ] Implement performance optimizations based on Profiler data.
4.7. References
●  [The Rules of React](https://react.dev/reference/rules)
●  [Thinking in React](https://react.dev/learn/thinking-in-react)
