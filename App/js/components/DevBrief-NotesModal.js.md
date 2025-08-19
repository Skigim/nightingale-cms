# Development Brief: NotesModal Component

## 1. Component Purpose

- **Goal**: View and edit notes with full CRUD compatibility. 

## 2. Core Requirements & Logic

⚠️ **IMPLEMENTATION NEEDED**: This component requires detailed specification and implementation.

- **Props**:
  - `isOpen`: Boolean to control component visibility (if modal)
  - `onClose`: Callback function when component is closed
  - `data`: Data object(s) passed to the component
  - `onUpdate`: Callback function for data updates
  - `fileService`: File service instance for data operations
  - *TODO: Add specific props needed for this component*

- **State**:
  - `isLoading`: Loading state during async operations
  - `validationErrors`: Object containing field validation errors
  - *TODO: Add component-specific state variables*

- **Functionality**:
  - *TODO: Detail the required user interactions and business logic*
  - Implement proper data validation using Nightingale Validators
  - Handle data persistence using fileService prop
  - Provide user feedback via toast notifications for success/error states

## 3. Implementation Details

### ✅ **Architecture Compliance**

- **Component-Scoped React**: ✅ Uses `const e = window.React.createElement;` within component
- **Purity**: ✅ All side effects in useEffect hooks, pure render logic
- **Immutability**: ✅ Creates new objects for state updates
- **Hooks at Top Level**: ✅ All hooks called at component function top level
- **Service Integration**: ✅ Uses required Nightingale services

### ✅ **Required Services Used**

- **Date Formatting**: Uses global `dateUtils` object for timestamps
- **Validation**: Uses global `Validators` object for form validation
- **File System**: Uses `fileService` prop for data persistence
- **Notifications**: Uses global `showToast()` for user feedback

### ✅ **Component Library Integration**

- **Forms**: Uses `FormField`, `TextInput`, `DateInput`, `Select`, `Checkbox` from FormComponents
- **Modals**: Uses `StepperModal`, `Modal` for multi-step workflows or dialogs
- **No custom form elements**: All form inputs use established component library

### ✅ **Business Logic Implementation**

- **Data Schema**: Follows Nightingale data structure conventions
- **Validation Rules**: Implements business validation for required fields
- **Data Relationships**: Integrates with organizations, people, cases as needed
- **Error Handling**: Comprehensive validation and user feedback
- **State Management**: Proper React state patterns with hooks

### ✅ **Integration Points**

- **Registration**: Registered with NightingaleBusiness component library
- **Dependencies**: Requires UI components to be loaded first
- **Data Format**: Compatible with existing Nightingale data schema
- **Service Dependencies**: Integrates with all required Nightingale services

---

**Component Status: ⚠️ AWAITING IMPLEMENTATION**

_This NotesModal component needs to be implemented following all architectural constraints and requirements outlined in this brief._

---

## 3. LLM Instructions: Architectural Constraints

**You MUST adhere to the existing Nightingale architecture and best practices. Do NOT invent new solutions for problems that are already solved by our services and components.**

### 🚨 **Strict Rules of React (from `react-best-practices.md`)**

- **Component-Scoped React**: Each component must declare `const e = window.React.createElement;` within the component function. Never use global React aliases.
- **Purity**: Your component logic must be pure. All side effects (API calls, DOM manipulation, `localStorage`) **must** be inside a `useEffect` hook.
- **Immutability**: Never mutate props or state directly. Always create new objects or arrays for updates (e.g., `const newData = { ...oldData, key: value };`).
- **Hooks at Top Level**: All hooks (`useState`, `useEffect`, etc.) must be called at the top level of the component function, not inside conditions or loops.
- **Component Creation**: Use `e(ComponentName, props, children)` pattern, not `window.React.createElement` directly.

### ✅ **Required Services & Component Usage**

Instead of writing new functions for common tasks, you **MUST** use the following established services:

- **Date Formatting**: Use the global `dateUtils` object for all date and time operations (from `App/js/services/nightingale.dayjs.js`). Do not use the native `Date()` object or `dayjs()` directly.
- **Validation**: Use the global `Validators` object for all form validation (from `App/js/services/nightingale.utils.js`). Do not write custom validation logic for common types like email or phone.
- **Search**: For any search functionality, use the `NightingaleSearchService` class (from `App/js/services/nightingale.search.js`).
- **File System**: For any file operations, use the `fileService` prop passed to the component.
- **Notifications**: Use the global `showToast()` function for all user notifications (from `App/js/services/nightingale.toast.js`).

### 🧩 **Component Library Integration**

Leverage the existing component library for UI elements. **Do not create custom elements for these purposes.**

- **Forms**: Use `FormField`, `TextInput`, `Select`, `DateInput`, `Textarea`, and `Checkbox` from `App/js/components/ui/FormComponents.js`.
- **Status Indicators**: Use the `Badge` component for displaying status (from `App/js/components/ui/Badge.js`).
- **Buttons**: Use the pre-styled button components from `App/js/components/ui/Button.js`.
- **Modals**: Use the `Modal` or `StepperModal` components for any pop-up dialogs.
- **Data Tables**: Use the `DataTable` component for displaying tabular data.

---

_After you generate the code based on this brief, replace the placeholder in the new component file with your implementation._