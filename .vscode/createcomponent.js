const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to get user input
const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function createComponent() {
  const componentName = await question(
    'Enter the new component name (e.g., UserProfileCard): '
  );
  if (!componentName) {
    console.error('❌ Component name cannot be empty.');
    rl.close();
    return;
  }

  const componentPurpose = await question(
    `What is the purpose of the ${componentName} component? `
  );

  const componentType = await question(
    'Is this a UI component (generic) or Business component (domain-specific)? [ui/business]: '
  );

  const isUIComponent =
    componentType.toLowerCase() === 'ui' || componentType.toLowerCase() === 'u';
  const componentLayer = isUIComponent ? 'ui' : 'business';

  // Ask if it's a modal component (only for business components)
  let isModalComponent = false;
  if (!isUIComponent) {
    const modalResponse = await question('Is this a modal component? [y/n]: ');
    isModalComponent =
      modalResponse.toLowerCase() === 'y' ||
      modalResponse.toLowerCase() === 'yes';
  }

  const componentFileName = `${componentName}.js`;
  const componentSubPath = isModalComponent ? 'modals' : '';
  const componentPath = path.join(
    __dirname,
    '..',
    'App',
    'js',
    'components',
    componentLayer,
    componentSubPath,
    componentFileName
  );
  const indexPath = path.join(
    __dirname,
    '..',
    'App',
    'js',
    'components',
    componentLayer,
    'index.js'
  );
  const readmePath = path.join(
    __dirname,
    '..',
    'App',
    'js',
    'components',
    'README.md'
  );
  const briefPath = path.join(
    __dirname,
    '..',
    'App',
    'js',
    'components',
    `DevBrief-${componentName}.js.md`
  );

  // --- 1. Create the Component File (Boilerplate) ---
  const componentTemplate = `/* eslint-disable react/prop-types */
/**
 * Nightingale Component Library - ${componentName}
 * Layer: ${isUIComponent ? 'UI (Generic)' : 'Business (Domain-Specific)'}
 *
 * ${componentPurpose}
 */
function ${componentName}({
  // TODO: Define props based on DevBrief requirements
}) {
  const e = window.React.createElement;
  const { useState, useEffect, useMemo, useCallback } = window.React;

  // TODO: Implement component logic here based on the DevBrief.
  ${
    isUIComponent
      ? '// UI Component: No business logic, pure presentation only'
      : '// Business Component: Implement domain-specific logic and validation'
  }

  // Don't render if not ready
  // if (!isReady) return null;

  return e(
    'div',
    { className: '${isUIComponent ? 'component-ui' : 'component-business'} p-4' },
    e('div', { className: 'text-gray-300' }, '${componentName} - TODO: Implement based on DevBrief')
  );
}

// Register with the ${componentLayer} component system
if (typeof window !== 'undefined') {
  window.${componentName} = ${componentName};

  ${
    isUIComponent
      ? `// Register with UI component library
  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('${componentName}', ${componentName});
  }`
      : `// Register with Business component library
  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent('${componentName}', ${componentName});
  }`
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${componentName} };
}`;
  fs.writeFileSync(componentPath, componentTemplate.trim());
  console.log(`✅ Created component file: ${componentPath}`);

  // --- 2. Register Component in Layer Index ---
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  if (isUIComponent) {
    // Add to UI_COMPONENTS array for UI components
    const uiComponentsRegex =
      /(const UI_COMPONENTS = \[[^\]]*)(  \/\/ Future|])/;
    const newUIComponent = `  {
    name: '${componentName}',
    path: 'js/components/ui/${componentFileName}',
    category: 'core',
    dependencies: [],
  },

  // Future`;
    if (indexContent.match(uiComponentsRegex)) {
      indexContent = indexContent.replace(
        uiComponentsRegex,
        `$1${newUIComponent}`
      );
    } else {
      console.warn(
        '⚠️  Could not find UI_COMPONENTS array pattern in index.js'
      );
    }
  } else {
    // Add to BUSINESS_COMPONENTS array for business components
    const businessComponentsRegex =
      /(  \/\/ Future business components will be added here:)/;
    const componentPathForRegistry = isModalComponent
      ? `js/components/business/modals/${componentFileName}`
      : `js/components/business/${componentFileName}`;
    const newBusinessComponent = `  {
    name: '${componentName}',
    path: '${componentPathForRegistry}',
    category: 'business',
    dependencies: [],
  },

  // Future business components will be added here:`;
    if (indexContent.match(businessComponentsRegex)) {
      indexContent = indexContent.replace(
        businessComponentsRegex,
        newBusinessComponent
      );
    } else {
      console.warn(
        '⚠️  Could not find business components insertion point in index.js'
      );
    }
  }

  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ Registered ${componentLayer} component in: ${indexPath}`);

  // --- 3. Update README.md ---
  const readmeContent = `
### ✅ ${componentName}

${componentPurpose}

**Features:**
- *TODO: Describe feature 1*
- *TODO: Describe feature 2*
`;
  fs.appendFileSync(readmePath, readmeContent);
  console.log(`✅ Updated documentation: ${readmePath}`);

  // --- 4. Generate Development Brief for the LLM ---
  const devBriefContent = `# Development Brief: ${componentName} Component

## 1. Component Purpose

- **Goal**: ${componentPurpose}

## 2. Core Requirements & Logic

⚠️ **IMPLEMENTATION NEEDED**: This component requires detailed specification and implementation.

- **Props**:
  - \`isOpen\`: Boolean to control component visibility (if modal)
  - \`onClose\`: Callback function when component is closed
  - \`data\`: Data object(s) passed to the component
  - \`onUpdate\`: Callback function for data updates
  ${!isUIComponent ? '- \`fileService\`: File service instance for data operations' : ''}
  - *TODO: Add specific props needed for this component*

- **State**:
  - \`isLoading\`: Loading state during async operations
  - \`validationErrors\`: Object containing field validation errors
  - *TODO: Add component-specific state variables*

- **Functionality**:
  - *TODO: Detail the required user interactions and business logic*
  - ${!isUIComponent ? 'Implement proper data validation using Nightingale Validators' : 'Pure presentation logic only'}
  - ${!isUIComponent ? 'Handle data persistence using fileService prop' : 'No data persistence logic'}
  - Provide user feedback via toast notifications for success/error states

## 3. Implementation Details

### ✅ **Architecture Compliance**

- **Component-Scoped React**: ✅ Uses \`const e = window.React.createElement;\` within component
- **Purity**: ✅ All side effects in useEffect hooks, pure render logic
- **Immutability**: ✅ Creates new objects for state updates
- **Hooks at Top Level**: ✅ All hooks called at component function top level
- **Service Integration**: ✅ Uses required Nightingale services

### ✅ **Required Services Used**

- **Date Formatting**: Uses global \`dateUtils\` object for timestamps
- **Validation**: Uses global \`Validators\` object for form validation${!isUIComponent ? '\n- **File System**: Uses \`fileService\` prop for data persistence' : ''}
- **Notifications**: Uses global \`showToast()\` for user feedback

### ✅ **Component Library Integration**

${
  isUIComponent
    ? `- **Pure UI Component**: No dependencies on other UI components, provides building blocks for business components
- **Generic Design**: Framework-agnostic, reusable across different contexts`
    : `- **Forms**: Uses \`FormField\`, \`TextInput\`, \`DateInput\`, \`Select\`, \`Checkbox\` from FormComponents
- **Modals**: Uses \`StepperModal\`, \`Modal\` for multi-step workflows or dialogs
- **No custom form elements**: All form inputs use established component library`
}

### ✅ **Business Logic Implementation**

${
  !isUIComponent
    ? `- **Data Schema**: Follows Nightingale data structure conventions
- **Validation Rules**: Implements business validation for required fields
- **Data Relationships**: Integrates with organizations, people, cases as needed
- **Error Handling**: Comprehensive validation and user feedback
- **State Management**: Proper React state patterns with hooks`
    : `- **No Business Logic**: Pure presentation component only
- **Props Interface**: Well-defined props for data and event handling
- **Styling**: Consistent with Nightingale dark theme design system`
}

### ✅ **Integration Points**

- **Registration**: Registered with ${isUIComponent ? 'NightingaleUI' : 'NightingaleBusiness'} component library
- **Dependencies**: ${isUIComponent ? 'Minimal dependencies, provides building blocks' : 'Requires UI components to be loaded first'}
- **Data Format**: Compatible with existing Nightingale data schema
- **Service Dependencies**: Integrates with all required Nightingale services

---

**Component Status: ⚠️ AWAITING IMPLEMENTATION**

_This ${componentName} component needs to be implemented following all architectural constraints and requirements outlined in this brief._

---

## 3. LLM Instructions: Architectural Constraints

**You MUST adhere to the existing Nightingale architecture and best practices. Do NOT invent new solutions for problems that are already solved by our services and components.**

### 🚨 **Strict Rules of React (from \`react-best-practices.md\`)**

- **Component-Scoped React**: Each component must declare \`const e = window.React.createElement;\` within the component function. Never use global React aliases.
- **Purity**: Your component logic must be pure. All side effects (API calls, DOM manipulation, \`localStorage\`) **must** be inside a \`useEffect\` hook.
- **Immutability**: Never mutate props or state directly. Always create new objects or arrays for updates (e.g., \`const newData = { ...oldData, key: value };\`).
- **Hooks at Top Level**: All hooks (\`useState\`, \`useEffect\`, etc.) must be called at the top level of the component function, not inside conditions or loops.
- **Component Creation**: Use \`e(ComponentName, props, children)\` pattern, not \`window.React.createElement\` directly.

### ✅ **Required Services & Component Usage**

Instead of writing new functions for common tasks, you **MUST** use the following established services:

- **Date Formatting**: Use the global \`dateUtils\` object for all date and time operations (from \`App/js/services/nightingale.dayjs.js\`). Do not use the native \`Date()\` object or \`dayjs()\` directly.
- **Validation**: Use the global \`Validators\` object for all form validation (from \`App/js/services/nightingale.utils.js\`). Do not write custom validation logic for common types like email or phone.
- **Search**: For any search functionality, use the \`NightingaleSearchService\` class (from \`App/js/services/nightingale.search.js\`).
- **File System**: For any file operations, use the \`fileService\` prop passed to the component.
- **Notifications**: Use the global \`showToast()\` function for all user notifications (from \`App/js/services/nightingale.toast.js\`).

### 🧩 **Component Library Integration**

Leverage the existing component library for UI elements. **Do not create custom elements for these purposes.**

- **Forms**: Use \`FormField\`, \`TextInput\`, \`Select\`, \`DateInput\`, \`Textarea\`, and \`Checkbox\` from \`App/js/components/ui/FormComponents.js\`.
- **Status Indicators**: Use the \`Badge\` component for displaying status (from \`App/js/components/ui/Badge.js\`).
- **Buttons**: Use the pre-styled button components from \`App/js/components/ui/Button.js\`.
- **Modals**: Use the \`Modal\` or \`StepperModal\` components for any pop-up dialogs.
- **Data Tables**: Use the \`DataTable\` component for displaying tabular data.

---

_After you generate the code based on this brief, replace the placeholder in the new component file with your implementation._`;
  fs.writeFileSync(briefPath, devBriefContent.trim());
  console.log(`✅ Generated development brief: ${briefPath}`);
  console.log('\n---');
  console.log('🎉 Component scaffolding complete!');
  console.log('\nNext Steps:');
  console.log(
    `1. Fill out the TODO sections in \`${briefPath}\` with specific requirements.`
  );
  console.log(
    '2. Copy the entire content of the brief and use it as your prompt to the LLM.'
  );
  console.log('---');

  rl.close();
}

createComponent();
