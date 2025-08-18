# Development Brief: CreateNewPersonModal Component

## 1. Component Purpose

- **Goal**: Creating and editing person entries in the Nightingale CMS system.

## 2. Core Requirements & Logic

✅ **IMPLEMENTATION COMPLETE**: This component utilizes the 'StepperModal' generic component to create a process through which a new person can be added to the data schema. Maintains consistent styling and follows React best practices.

- **Props**:
  - `isOpen`: Boolean to control modal visibility
  - `onClose`: Callback function when modal is closed
  - `onPersonCreated`: Callback function when person is successfully created/updated
  - `editPersonId`: Optional ID for editing existing person (null for new person)
  - `fullData`: Complete application data for validation and relationships

- **State**:
  - `currentStep`: Current step in the stepper modal (0-3)
  - `personData`: Form data for the person being created/edited
  - `validationErrors`: Object containing field validation errors
  - `isLoading`: Loading state during save operations

- **Functionality**:
  - **Multi-step workflow**: 4 steps using StepperModal component
    1. Basic Information (name, DOB, SSN)
    2. Contact Information (phone, email, address, mailing address)
    3. Additional Details (living arrangement, organization)
    4. Review & Save (summary and validation)
  - **Real-time validation**: Uses Nightingale Validators service for email, phone, SSN validation
  - **Address management**: Separate physical and mailing addresses with "same as physical" option
  - **Organization integration**: Links person to existing organizations
  - **Edit mode**: Can edit existing people when editPersonId is provided
  - **Data persistence**: Uses fileService for saving to JSON data file
  - **Toast notifications**: Success/error messages using showToast service

## 3. Implementation Details

### ✅ **Architecture Compliance**

- **Component-Scoped React**: ✅ Uses `const e = window.React.createElement;` within component
- **Purity**: ✅ All side effects in useEffect hooks, pure render logic
- **Immutability**: ✅ Creates new objects for state updates
- **Hooks at Top Level**: ✅ All hooks called at component function top level
- **Service Integration**: ✅ Uses required Nightingale services

### ✅ **Required Services Used**

- **Date Formatting**: Uses global `dateUtils` object for timestamps
- **Validation**: Uses global `Validators` object for email, phone, SSN validation
- **File System**: Uses global `fileService` for data persistence
- **Notifications**: Uses global `showToast()` for user feedback

### ✅ **Component Library Integration**

- **Forms**: Uses `FormField`, `TextInput`, `DateInput`, `Select`, `Checkbox` from FormComponents
- **Modals**: Uses `StepperModal` for multi-step workflow
- **No custom form elements**: All form inputs use established component library

### ✅ **Business Logic Implementation**

- **Person Data Schema**: Follows Nightingale person data structure
- **Validation Rules**: Implements business validation for required fields
- **Data Relationships**: Integrates with organizations and manages IDs
- **Error Handling**: Comprehensive validation and user feedback
- **State Management**: Proper React state patterns with hooks

### ✅ **Integration Points**

- **Registration**: Registered with NightingaleBusiness component library
- **Dependencies**: Requires StepperModal and FormComponents to be loaded
- **Data Format**: Compatible with existing Nightingale data schema
- **Service Dependencies**: Integrates with all required Nightingale services

---

**Component Status: ✅ IMPLEMENTED AND READY FOR USE**

_The CreateNewPersonModal component has been successfully implemented following all architectural constraints and requirements outlined in this brief. It provides a complete multi-step workflow for creating and editing person entries in the Nightingale CMS._

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

- **Date Formatting**: Use the global `dateUtils` object for all date and time operations (from `App/js/nightingale.dayjs.js`). Do not use the native `Date()` object or `dayjs()` directly.
- **Validation**: Use the global `Validators` object for all form validation (from `App/js/nightingale.utils.js`). Do not write custom validation logic for common types like email or phone.
- **Search**: For any search functionality, use the `NightingaleSearchService` class (from `App/js/nightingale.utils.js`).
- **File System**: For any file operations, use the global `fileService` instance.
- **Notifications**: Use the global `showToast()` function for all user notifications (from `App/js/nightingale.toast.js`).

### 🧩 **Component Library Integration**

Leverage the existing component library for UI elements. **Do not create custom elements for these purposes.**

- **Forms**: Use `<FormField>`, `<TextInput>`, `<Select>`, `<DateInput>`, `<Textarea>`, and `<Checkbox>` from `App/Components/FormComponents.js`.
- **Status Indicators**: Use the `<Badge>` component for displaying status (from `App/Components/Badge.js`).
- **Buttons**: Use the pre-styled button components like `<PrimaryButton>` and `<SecondaryButton>` (from `App/Components/Button.js`).
- **Modals**: Use the `<Modal>`, `<ConfirmationModal>`, or `<StepperModal>` components for any pop-up dialogs.
- **Data Tables**: Use the `<DataTable>` component for displaying tabular data.

---

_After you generate the code based on this brief, replace the placeholder in the new component file with your implementation._
