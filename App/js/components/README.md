# Nightingale Component Library - Layered Architecture

## 🏗️ **Architecture Overview**

The Nightingale Component Library is now organized into two distinct layers:

### **🎨 UI Layer** (`Components/ui/`)

**Generic, reusable UI components with no business logic**

- **Purpose**: Framework-agnostic UI components that could be extracted into a standalone library
- **Characteristics**: No domain knowledge, pure presentation logic, highly reusable
- **Future**: Could be compiled into a npm package for use across multiple projects

**Components:**

- `Button.js` - Button variants (Primary, Secondary, Success, Danger, etc.)
- `Badge.js` - Status indicators and badges
- `DataTable.js` - Sortable, filterable data tables
- `FormComponents.js` - Form inputs, validation, and field components
- `SearchBar.js` - Search input with filtering capabilities
- `Modal.js` - Base modal component with overlay and focus management
- `StepperModal.js` - Multi-step workflow modal component

### **🏢 Business Layer** (`Components/business/`)

**Domain-specific components with Nightingale CMS business logic**

- **Purpose**: Components that understand case management, people, organizations, and CMS workflows
- **Characteristics**: Uses UI components + adds business rules, data validation, and domain logic
- **Scope**: Specific to Nightingale CMS functionality

**Components:**

- `CaseCreationModal.js` - Case creation workflow using StepperModal
- `CaseCreationSteps.js` - Step definitions for case creation process
- `FinancialItemModal.js` - _(Future)_ Financial item management
- `PersonDetailsModal.js` - _(Future)_ Person and contact management
- `CasePreviewModal.js` - _(Future)_ Case overview and preview
- `SettingsModal.js` - _(Future)_ Application settings

## 📦 **Loading Strategy**

### **Automatic Loading**

The main `Components/index.js` orchestrates loading both layers:

1. **Phase 1**: Load UI components first (no dependencies)
2. **Phase 2**: Load Business components (depend on UI components)
3. **Phase 3**: All components available globally

### **Event System**

```javascript
// Listen for UI layer ready
window.addEventListener('nightingale:ui:ready', (event) => {
  console.log('UI components loaded:', event.detail.components);
});

// Listen for Business layer ready
window.addEventListener('nightingale:business:ready', (event) => {
  console.log('Business components loaded:', event.detail.components);
});

// Listen for everything ready
window.addEventListener('nightingale:ready', (event) => {
  console.log('All components loaded:', event.detail);
});
```

## 🔧 **Usage Patterns**

### **UI Components** (Generic)

```javascript
// Pure UI component - no business logic
function MyGenericModal({ isOpen, onClose, title, children }) {
  const e = window.React.createElement;

  return e(window.Modal, { isOpen, onClose, title }, children);
}
```

### **Business Components** (Domain-Specific)

```javascript
// Business component - uses UI components + domain logic
function CaseCreationModal({ isOpen, onClose, fullData, onCaseCreated }) {
  const e = window.React.createElement;

  // Business logic: case validation, workflow rules, data transforms
  const [caseData, setCaseData] = useState(getInitialCaseData());

  return e(
    window.StepperModal,
    {
      isOpen,
      onClose,
      title: 'Create New Case',
      // ... business-specific props
    },
    renderBusinessLogic()
  );
}
```

## 🎯 **Benefits**

### **🎨 UI Layer Benefits:**

- **Reusability**: Components can be used in any React application
- **Testability**: Pure UI components are easy to test in isolation
- **Library Potential**: Could be extracted as `@nightingale/ui-components`
- **No Dependencies**: UI components have no business logic dependencies

### **🏢 Business Layer Benefits:**

- **Domain Focus**: Components understand Nightingale CMS business rules
- **Composition**: Builds on top of proven UI components
- **Maintainability**: Business logic separated from presentation logic
- **Flexibility**: Easy to modify business rules without touching UI

### **🏗️ Architecture Benefits:**

- **Separation of Concerns**: Clear boundaries between UI and business logic
- **Scalability**: Easy to add new components to appropriate layer
- **Future-Proof**: UI layer can become standalone library
- **Backward Compatibility**: Existing code continues to work

## 🚀 **Future Roadmap**

### **Phase 1: Migration** _(Current)_

- ✅ Reorganize existing components into layers
- ✅ Create layered loading system
- 🔄 Move embedded modals to business layer components

### **Phase 2: UI Library**

- Extract UI layer into standalone npm package
- Add comprehensive testing for UI components
- Create Storybook documentation for UI components
- Implement TypeScript definitions

### **Phase 3: Business Components**

- Complete migration of all embedded modals
- Add comprehensive business component documentation
- Implement domain-specific testing strategies
- Create business component development guidelines

## 📁 **Directory Structure**

```
Components/
├── index.js                    # Main orchestrator
├── 🎨 ui/                     # Generic UI Layer
│   ├── index.js               # UI component loader
│   ├── Button.js              # ← No business logic
│   ├── Badge.js               # ← Pure presentation
│   ├── DataTable.js           # ← Generic data display
│   ├── FormComponents.js      # ← Form primitives
│   ├── SearchBar.js           # ← Search UI only
│   └── modals/
│       ├── Modal.js           # ← Base modal
│       └── StepperModal.js    # ← Generic stepper
│
├── 🏢 business/               # Business Logic Layer
│   ├── index.js               # Business component loader
│   └── modals/
│       ├── CaseCreationModal.js     # ← Case management logic
│       ├── CaseCreationSteps.js     # ← Domain workflows
│       ├── FinancialItemModal.js    # ← Financial business rules
│       ├── PersonDetailsModal.js    # ← Person management logic
│       └── CasePreviewModal.js      # ← Case preview logic
│
└── Docs/
    ├── README.md              # This file
    └── Components-Architecture.md
```

## 🧪 **Development Guidelines**

### **When to Create a UI Component:**

- Component has no knowledge of cases, people, organizations
- Component could be useful in other applications
- Component is purely presentational
- Component has no business validation rules

### **When to Create a Business Component:**

- Component understands Nightingale CMS domain concepts
- Component implements business validation or workflows
- Component combines multiple UI components with domain logic
- Component manages CMS-specific state or data transforms

This architecture sets up Nightingale CMS for long-term maintainability and potential component library extraction while maintaining all existing functionality.

### ✅ CreateNewPersonModal

**Purpose**: Multi-step modal for creating and editing person entries in the Nightingale CMS.

**Features:**

- 4-step workflow using StepperModal (Basic Info, Contact Info, Additional Details, Review)
- Real-time validation using Nightingale Validators service
- Address management with separate physical and mailing addresses
- Organization integration and relationship management
- Edit mode for updating existing people
- Data persistence through fileService
- Toast notifications for user feedback

**Dependencies**: StepperModal, FormComponents
**Layer**: Business (Domain-Specific)
**Status**: ✅ Complete and ready for use
