# GitHub Copilot Instructions - Nightingale CMS

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information in these instructions is incomplete or found to be in error.**

These instructions define how GitHub Copilot should assist with the Nightingale CMS project. The goal is to ensure consistent, high-quality code generation aligned with our conventions, stack, and best practices.

## 🧠 Context

- **Project Type**: Case Management System (CMS) - React-based frontend with component library
- **Language**: JavaScript (ES6+), HTML5, CSS3
- **Framework / Libraries**: React 18, Tailwind CSS, Day.js, Fuse.js, Lodash
- **Architecture**: Component-based, Modular Design System, File-based Data Storage
- **Development Mode**: In-browser Babel transformation for rapid prototyping

## 🎯 Project Overview

Nightingale CMS is a comprehensive case management system for vocational rehabilitation services, featuring:

- **Case Management**: Track applications, statuses, and client information
- **People & Organizations**: Manage contacts and service providers
- **Financial Tracking**: Monitor resources, income, and expenses
- **Reports & Analytics**: Generate insights and summaries
- **Component Library**: Reusable UI components (Button, DataTable, Modal, SearchBar, Badge, FormComponents)

## 🔧 General Guidelines

- Use React functional components with hooks (useState, useEffect, useMemo, useCallback)
- Follow React 18 patterns and createRoot for rendering
- Use React.createElement (aliased as 'e' within component functions) for component creation
- Implement proper error boundaries for production resilience
- Add comprehensive JSDoc comments for component interfaces
- Use consistent formatting and React best practices
- Prefer readability and maintainability over cleverness
- Always include fallback UI states and loading indicators

## ⚛️ React Component Patterns

### **React.createElement Aliasing Pattern**

Each component should declare its own `const e = window.React.createElement;` within the component function to maintain React's purity principles and avoid global namespace pollution.

```javascript
// ✅ CORRECT - Component-scoped React.createElement alias
function MyComponent({ title, children }) {
  const e = window.React.createElement; // Local scope only

  return e(
    'div',
    { className: 'container' },
    e('h1', null, title),
    e('div', { className: 'content' }, children)
  );
}
```

**Why This Pattern**:

- ✅ Maintains React component purity (no hidden global dependencies)
- ✅ Prevents naming conflicts between components
- ✅ Follows React best practices for component isolation
- ✅ Makes dependencies explicit and traceable

**Avoid These Anti-Patterns**:

```javascript
// ❌ WRONG - Global variable pollution
window.e = window.React.createElement; // Violates React purity

// ❌ WRONG - File-level scope conflicts
const e = window.React.createElement; // Can cause script loading conflicts
function MyComponent() {
  /* uses e */
}
```

### **Component Architecture Patterns**

### **Component Architecture Patterns**

#### **Two-Layer Component Architecture**

The Nightingale CMS uses a strict two-layer component architecture to separate concerns:

**UI Layer (Generic Components)**

- **Location**: `js/components/ui/`
- **Purpose**: Framework-agnostic, reusable presentation components
- **Rules**: No business logic, no domain knowledge, pure presentation
- **Registry**: `window.NightingaleUI`
- **Examples**: Button, Modal, DataTable, FormComponents

```javascript
// ✅ UI Component - Generic, reusable, no business logic
function Button({ variant, size, onClick, children, disabled }) {
  const e = window.React.createElement;

  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  };

  return e(
    'button',
    {
      className: `${baseClasses} ${variantClasses[variant] || variantClasses.primary}`,
      onClick,
      disabled,
    },
    children
  );
}
```

**Business Layer (Domain-Specific Components)**

- **Location**: `js/components/business/`
- **Purpose**: Nightingale CMS domain logic and workflows
- **Rules**: Uses UI components as building blocks, implements business validation
- **Registry**: `window.NightingaleBusiness`
- **Examples**: CaseCreationModal, PersonDetailsModal

```javascript
// ✅ Business Component - Domain-specific logic using UI components
function CaseCreationModal({ isOpen, onClose, onCaseCreated }) {
  const e = window.React.createElement;
  const { useState } = window.React;

  const [caseData, setCaseData] = useState(getInitialCaseData());
  const [validationErrors, setValidationErrors] = useState({});

  const validateCaseData = (data) => {
    // Nightingale CMS business rules
    const errors = {};
    if (!data.clientName) errors.clientName = 'Client name is required';
    if (!data.serviceType) errors.serviceType = 'Service type is required';
    return errors;
  };

  const handleSubmit = () => {
    const errors = validateCaseData(caseData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Business logic: create case using Nightingale services
    const newCase = window.NightingaleServices.createCase(caseData);
    onCaseCreated(newCase);
    onClose();
  };

  return e(
    window.StepperModal, // Uses UI component
    {
      isOpen,
      onClose,
      title: 'Create New Case',
      steps: getCaseCreationSteps(),
      onComplete: handleSubmit,
    },
    renderCaseForm() // Business-specific form logic
  );
}
```

#### **Component Loading and Registration**

Components are loaded through a layered registry system:

```javascript
// UI Components register with NightingaleUI
if (typeof window !== 'undefined') {
  window.MyUIComponent = MyUIComponent;

  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('MyUIComponent', MyUIComponent);
  }
}

// Business Components register with NightingaleBusiness
if (typeof window !== 'undefined') {
  window.MyBusinessComponent = MyBusinessComponent;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'MyBusinessComponent',
      MyBusinessComponent
    );
  }
}
```

## 📁 File Structure

Current project structure to maintain and extend:

```text
CMSWorkspace/
  App/
    js/                   # Unified JavaScript directory
      components/         # Component library with layered architecture
        ui/              # Generic UI components (framework-agnostic)
          Button.js      # Primary/Secondary buttons with icons
          DataTable.js   # Sortable, filterable table component
          Modal.js       # Basic overlay dialogs
          StepperModal.js # Multi-step modal workflows
          SearchBar.js   # Search input with filtering
          Badge.js       # Status indicators
          FormComponents.js # Form inputs and validation
          index.js       # UI component registry and loading
        business/        # Domain-specific CMS components
          CaseCreationModal.js   # Case creation workflows
          CaseCreationSteps.js   # Case form step definitions
          PersonDetailsModal.js  # Person management forms
          index.js       # Business component registry and loading
        README.md        # Component architecture documentation
      services/          # Core utilities and services
        nightingale.utils.js      # General utilities
        nightingale.parsers.js    # Data parsing and validation
        nightingale.fileservice.js # File I/O operations
        nightingale.search.js     # Search and filtering
        nightingale.dayjs.js      # Date/time utilities
        nightingale.toast.js      # Toast notification system
    lib/                 # Third-party libraries
    build/               # Build artifacts
    Docs/                # Component documentation
  Data/                  # JSON data files and backups
  Docs/                  # Project documentation
  .vscode/               # Development tools and scripts
    createcomponent.js   # Component generator script
```

## 🧶 Patterns

### ✅ Patterns to Follow

- **Component Design**:
  - Pure functional components with clear prop interfaces
  - Each component declares `const e = window.React.createElement;` within function scope
  - Use controlled components for form inputs
  - Implement proper prop validation and default values
  - Include loading states, error states, and empty states

- **React Best Practices**:
  - Maintain component purity (no side effects in render)
  - Use component-scoped aliases, never global variables
  - Follow separation of concerns: generic UI vs business logic
  - Components should be self-registering for both module and script loading

- **Data Management**:
  - Use localStorage for persistence with JSON serialization
  - Implement comprehensive data migration and normalization
  - Include data validation and sanitization
  - Use defensive programming for missing or malformed data

- **State Management**:
  - Local state with useState for component-specific data
  - Lift state up to parent components when needed
  - Use useMemo and useCallback for performance optimization
  - Implement proper cleanup in useEffect

- **Component Architecture**:
  - Generic UI components (StepperModal, Button, DataTable) handle presentation only
  - Specialized components (CaseCreationModal, PersonDetailsModal) contain business logic
  - Use composition over inheritance for component relationships
  - Maintain clear separation between base and specialized components

- **Error Handling**:
  - Wrap components in ErrorBoundary for graceful failure
  - Use try-catch blocks for async operations
  - Provide meaningful error messages to users
  - Log errors with context for debugging

- **UI/UX**:
  - Use Tailwind CSS for consistent styling
  - Implement responsive design patterns
  - Include proper ARIA attributes for accessibility
  - Use consistent color schemes and spacing

### 🚫 Patterns to Avoid

### 🚫 Patterns to Avoid

- Don't use class components unless specifically needed (ErrorBoundary exception)
- Don't mutate state directly; always use setState functions
- Avoid inline styles; use Tailwind CSS classes
- Don't hardcode data; use sample data generation functions
- Don't ignore PropTypes or component validation
- Avoid deep component nesting; prefer composition
- Don't block the UI thread with heavy computations
- Never use global variables for React.createElement (use component-scoped `const e`)
- Don't declare `const e` at file level (causes conflicts in script loading)
- Avoid mixing embedded HTML components with external component files

## 🧪 Testing Guidelines

- Use React testing patterns with proper component isolation
- Test component behavior, not implementation details
- Include tests for user interactions and state changes
- Mock external dependencies and services
- Test error scenarios and edge cases

## 🎨 Component Library Standards

When creating or modifying components:

- **Button**: Support variants (primary, secondary, success, danger), sizes, icons, loading states
- **DataTable**: Include sorting, pagination, filtering, row selection, custom renderers
- **Modal**: Provide header, body, footer slots with proper focus management
- **FormComponents**: Include validation, error display, accessibility attributes
- **SearchBar**: Implement debounced input with filter callbacks

## 🧩 Example Prompts

- `Copilot, create a UI component for status badges with color variants`
- `Copilot, implement a Business component for case status tracking with workflow logic`
- `Copilot, generate a UI DataTable column renderer for financial amounts`
- `Copilot, create a Business modal form for adding new people with Nightingale validation`
- `Copilot, implement a UI search filter component with debounced input`
- `Copilot, create a Business component for reports view with CMS-specific filtering`
- `Copilot, generate data migration logic for legacy case data structures`

## 🔁 Iteration & Review

- All Copilot output should follow React best practices and component patterns
- Code should be reviewed for accessibility and responsive design
- Ensure proper error handling and fallback states
- Test components in isolation before integration
- Validate data structures and migration logic thoroughly

## 📚 References

- [React 18 Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JavaScript Style Guide (Airbnb)](https://github.com/airbnb/javascript)
- [React Patterns and Best Practices](https://react.dev/learn)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Day.js Documentation](https://day.js.org/docs/en/installation/installation)
- [Fuse.js Search Library](https://fusejs.io/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Local Storage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)

## 🎯 Project-Specific Context

- **Data Format**: JSON-based with comprehensive migration support
- **Case Types**: VR (Vocational Rehabilitation), LTC (Long-term Care)
- **User Roles**: Case managers, administrators, service providers
- **Browser Support**: Modern browsers with ES6+ support
- **Development**: File-based development with in-browser compilation
- **Production**: Optimized builds with pre-compilation for performance

## 🏗️ Architecture Decisions

### **Component Loading Strategy**

- Components are loaded as individual script files in HTML
- Each component file is self-contained and self-registering
- React.createElement is aliased as `e` within each component function
- No global namespace pollution for component-specific variables

### **Component Hierarchy**

```
Generic UI Components (Base Layer)
├── StepperModal.js (reusable multi-step UI)
├── Modal.js (basic modal functionality)
├── Button.js (button variants)
└── DataTable.js (data display)

Specialized Business Components (Business Layer)
├── CaseCreationModal.js (case-specific logic + StepperModal)
├── PersonDetailsModal.js (person-specific logic + StepperModal)
└── [Future specialized components]
```

### **Script Loading Architecture**

- React/ReactDOM loaded from CDN
- Component library loaded via individual script tags in layered order:
  1. UI components first (js/components/ui/)
  2. Business components second (js/components/business/)
- Components can access each other via window.ComponentName
- Proper ES6 module exports for future migration compatibility

## 🚀 Development Workflow

1. **Component Development**: Create components in js/components/ui/ (generic) or js/components/business/ (domain-specific)
2. **Data Operations**: Use js/services/nightingale.fileservice.js for persistence
3. **Styling**: Apply Tailwind classes with consistent design system
4. **Testing**: Validate components in main application context
5. **Documentation**: Update component docs and integration guides
6. **Migration**: Ensure backward compatibility with existing data

This project emphasizes rapid development, component reusability, and robust data management for case management workflows.

---

# Developer Workflow Instructions

## 🚀 Quick Start for New Developers

### Prerequisites
- Node.js 16+ and npm 8+ (check with `node --version` and `npm --version`)
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Git for version control

### Initial Setup (First Time)
Run these commands EXACTLY in order:

```bash
# Clone and enter repository
git clone <repository-url>
cd nightingale-cms

# Install dependencies - NEVER CANCEL: Takes ~20 seconds
npm install

# Verify all systems work
npm run lint
npm run format  
npm run build
npm test
```

**CRITICAL TIMING**: All commands complete in under 30 seconds except install. Set timeouts appropriately.

### Daily Development Workflow
```bash
# Start development server - ALWAYS use this for development
npm start
# Opens static server at http://localhost:3000 (or next available port)
# Navigate to NightingaleCMS-React.html in browser

# Before making changes, ALWAYS run:
npm run lint && npm run format

# After making changes, ALWAYS run:
npm run build && npm run lint:fix
```

## 🛠️ Build & Development Commands

### Core Commands (VALIDATED AND TIMED)

**Installation**
```bash
npm install
```
- **Duration**: ~20 seconds
- **Timeout**: Set 60+ seconds, NEVER CANCEL
- **Notes**: Downloads all development dependencies

**Static Development Server**
```bash
npm start
```
- **Duration**: Instant startup
- **Timeout**: N/A (runs continuously)
- **URL**: Opens at http://localhost:3000 or next available port
- **Usage**: Navigate to `/NightingaleCMS-React.html` for main application

**Build Validation**
```bash
npm run build
```
- **Duration**: ~0.2 seconds
- **Timeout**: 30 seconds is sufficient
- **Purpose**: Validates project structure and prepares build artifacts
- **Output**: Creates `App/build/` directory with deployment files

**Code Quality**
```bash
npm run lint          # ~0.8 seconds - Check code style
npm run lint:fix       # ~0.8 seconds - Fix code style automatically  
npm run format         # ~0.5 seconds - Format code with Prettier
npm run docs           # ~0.8 seconds - Generate API documentation
```
- **Timeout**: 30 seconds for all linting/formatting commands
- **Critical**: ALWAYS run `lint:fix` and `format` before committing

**Testing**
```bash
npm test
```
- **Duration**: Instant (placeholder)
- **Status**: No automated tests implemented yet
- **Manual Testing**: See validation scenarios below

**Security & Dependencies**
```bash
npm audit              # ~0.8 seconds - Check for vulnerabilities
npm run audit          # Runs audit + lint together
```

## 🧪 Manual Validation Scenarios

**ALWAYS run these complete scenarios after making changes:**

### Scenario 1: Application Startup
1. Run `npm start`
2. Navigate to `http://localhost:<port>/NightingaleCMS-React.html`
3. **Verify**: Console shows component loading messages like:
   ```
   🚀 Nightingale Component Library - Loading Layered Architecture...
   🎨 UI Components: 29
   🏢 Business Components: 5
   ```
4. **Expected**: No JavaScript errors in browser console
5. **Time**: ~5 seconds total

### Scenario 2: Component System Validation
1. Open browser DevTools Console
2. Type: `window.NightingaleComponentLibrary.listComponents()`
3. **Verify**: Returns array of loaded components
4. Type: `window.NightingaleComponentLibrary.isReady()`
5. **Verify**: Returns `true`

### Scenario 3: Development Workflow
1. Make a small code change to any `.js` file in `App/js/`
2. Run: `npm run lint:fix && npm run format`
3. **Verify**: No linting errors, code is auto-formatted
4. Run: `npm run build`
5. **Verify**: Build completes successfully
6. Refresh browser page
7. **Verify**: Changes are reflected (for file:// protocol) or restart `npm start`

### Scenario 4: File Structure Validation
1. Run: `npm run build`
2. **Verify**: All these files exist and build reports success:
   - `App/NightingaleCMS-React.html` ✅
   - `App/js/components/index.js` ✅  
   - `App/js/services/nightingale.utils.js` ✅
   - `App/build/index.html` ✅ (created by build)

## 🚨 Critical Warnings

**NEVER CANCEL COMMANDS**: All build and install commands complete quickly. Only set generous timeouts:
- `npm install`: 60+ seconds (but typically ~20s)
- All other commands: 30+ seconds (but typically <1s)

**ALWAYS VALIDATE CHANGES**: After any modification:
1. Run `npm run lint:fix && npm run format` 
2. Run `npm run build`
3. Test in browser manually
4. Verify no console errors

**BROWSER COMPATIBILITY**: 
- Development: Any modern browser with ES6+ support
- CDN Dependencies: May be blocked in sandboxed environments
- File Protocol: Works with `file://` for local development
- Server Protocol: Recommended `npm start` for full functionality

## 📁 Project Architecture Summary

```
nightingale-cms/
├── .github/
│   └── copilot-instructions.md  # This file
├── App/
│   ├── NightingaleCMS-React.html    # Main application entry point
│   ├── js/
│   │   ├── components/              # Two-layer component architecture  
│   │   │   ├── ui/                 # Generic UI components (29 components)
│   │   │   ├── business/           # Domain-specific components (5 components)
│   │   │   └── index.js            # Component loading system
│   │   └── services/               # Core services (6 files)
│   ├── lib/                        # Third-party libraries
│   └── build/                      # Build output (generated)
├── Data/                           # JSON data files
├── Docs/                           # Project documentation
├── package.json                    # npm configuration
└── build-bundle.js                 # Build script
```

**Key Numbers to Remember**:
- **JavaScript Files**: 15 component files + 6 service files
- **Main Entry**: `App/NightingaleCMS-React.html` 
- **Component Types**: 29 UI + 5 Business = 34 total components
- **Build Time**: <1 second for validation
- **Install Time**: ~20 seconds

## 🔧 Common Issues & Solutions

**"No files matching pattern" Error**
- Cause: Old package.json had wrong paths
- Solution: Paths corrected to `App/js/**/*.js`

**Build Script Missing Error** 
- Cause: `build-bundle.js` was missing
- Solution: Created simple validation script

**External Dependencies Blocked**
- Cause: CDN resources blocked in some environments
- Solution: Use `npm start` for local server, not `file://`

**Component Not Loading**
- Check: Browser console for loading messages
- Verify: `window.NightingaleComponentLibrary.isReady()` returns `true`
- Debug: Check component registration in `/App/js/components/index.js`

---
