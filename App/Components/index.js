/**
 * Nightingale Application Suite - Component Library Index
 *
 * Central export point for all reusable components across the Nightingale suite.
 * This file provides both ES6 module exports and global window assignments
 * for compatibility with the current script-tag based architecture.
 */

/**
 * Component Registry
 * Maps component names to their implementations for dynamic loading
 */
const ComponentRegistry = {
  // Core Components
  SearchBar: null,
  Modal: null,
  ConfirmationModal: null,
  FormModal: null,
  Badge: null,
  StatusBadge: null,
  ProgressBadge: null,
  CountBadge: null,
  MultiBadge: null,

  // Form Components
  FormField: null,
  TextInput: null,
  Select: null,
  DateInput: null,
  Textarea: null,
  Checkbox: null,

  // Data Components
  DataTable: null,

  // Button Components
  Button: null,
  PrimaryButton: null,
  SecondaryButton: null,
  DangerButton: null,
  SuccessButton: null,
  OutlineButton: null,
  GhostButton: null,
  LinkButton: null,
};

/**
 * Track loaded scripts to prevent duplicates
 */
const loadedScripts = new Set();

/**
 * Component to file mapping
 */
const componentFileMap = {
  SearchBar: 'SearchBar.js',
  Modal: 'modals/Modal.js',
  ConfirmationModal: 'modals/Modal.js',
  FormModal: 'modals/Modal.js',
  Badge: 'Badge.js',
  StatusBadge: 'Badge.js',
  ProgressBadge: 'Badge.js',
  CountBadge: 'Badge.js',
  MultiBadge: 'Badge.js',
  FormField: 'FormComponents.js',
  TextInput: 'FormComponents.js',
  Select: 'FormComponents.js',
  DateInput: 'FormComponents.js',
  Textarea: 'FormComponents.js',
  Checkbox: 'FormComponents.js',
  DataTable: 'DataTable.js',
  Button: 'Button.js',
  PrimaryButton: 'Button.js',
  SecondaryButton: 'Button.js',
  DangerButton: 'Button.js',
  SuccessButton: 'Button.js',
  OutlineButton: 'Button.js',
  GhostButton: 'Button.js',
  LinkButton: 'Button.js',
};

/**
 * Register a component in the global registry
 * @param {string} name - Component name
 * @param {Function} component - Component function
 */
function registerComponent(name, component) {
  ComponentRegistry[name] = component;

  // Also make available on window for script tag usage
  if (typeof window !== 'undefined') {
    if (!window.NightingaleComponents) {
      window.NightingaleComponents = {};
    }
    window.NightingaleComponents[name] = component;
  }
}

/**
 * Get a component from the registry
 * @param {string} name - Component name
 * @returns {Function|null} Component function or null if not found
 */
function getComponent(name) {
  return (
    ComponentRegistry[name] ||
    (window.NightingaleComponents && window.NightingaleComponents[name]) ||
    null
  );
}

/**
 * Load multiple component files and register them globally
 * @param {Array<string>} componentNames - Array of component names to load
 * @returns {Promise} Promise that resolves when all components are loaded
 */
async function loadComponents(componentNames) {
  const loadPromises = componentNames.map((name) => {
    return new Promise((resolve, reject) => {
      // Check if component is already loaded to prevent duplicates
      if (getComponent(name)) {
        console.log(`📦 Component ${name} already loaded, skipping`);
        resolve(name);
        return;
      }

      // Get filename from component file map
      const fileName = componentFileMap[name] || `${name}.js`;

      // Check if script is already loaded
      if (loadedScripts.has(fileName)) {
        console.log(
          `📦 Script ${fileName} already loaded, registering component ${name}`
        );
        registerComponentsAfterLoad(name);
        resolve(name);
        return;
      }

      const scriptSrc = `Components/${fileName}`;

      console.log(`🔄 Loading component script: ${scriptSrc}`);

      const script = document.createElement('script');
      script.src = scriptSrc;
      script.type = 'text/javascript'; // Explicitly set type to prevent Babel processing
      script.setAttribute('data-babel', 'false'); // Additional hint for Babel to ignore
      script.onload = () => {
        loadedScripts.add(fileName);
        // After script loads, the component should be available globally
        // Register it in our registry for consistency
        registerComponentsAfterLoad(name);
        resolve(name);
      };
      script.onerror = () => reject(`Failed to load ${name}`);
      document.head.appendChild(script);
    });
  });

  return Promise.all(loadPromises);
}

/**
 * Helper function to register components after a script loads
 */
function registerComponentsAfterLoad(name) {
  if (name === 'Modal' && typeof window.Modal !== 'undefined') {
    registerComponent('Modal', window.Modal);
    if (typeof window.ConfirmationModal !== 'undefined')
      registerComponent('ConfirmationModal', window.ConfirmationModal);
    if (typeof window.FormModal !== 'undefined')
      registerComponent('FormModal', window.FormModal);
  } else if (name === 'SearchBar' && typeof window.SearchBar !== 'undefined') {
    registerComponent('SearchBar', window.SearchBar);
  } else if (name === 'Badge' && typeof window.Badge !== 'undefined') {
    registerComponent('Badge', window.Badge);
    if (typeof window.StatusBadge !== 'undefined')
      registerComponent('StatusBadge', window.StatusBadge);
    if (typeof window.ProgressBadge !== 'undefined')
      registerComponent('ProgressBadge', window.ProgressBadge);
    if (typeof window.CountBadge !== 'undefined')
      registerComponent('CountBadge', window.CountBadge);
    if (typeof window.MultiBadge !== 'undefined')
      registerComponent('MultiBadge', window.MultiBadge);
  } else if (
    name === 'FormComponents' &&
    typeof window.FormField !== 'undefined'
  ) {
    registerComponent('FormField', window.FormField);
    if (typeof window.TextInput !== 'undefined')
      registerComponent('TextInput', window.TextInput);
    if (typeof window.Select !== 'undefined')
      registerComponent('Select', window.Select);
    if (typeof window.DateInput !== 'undefined')
      registerComponent('DateInput', window.DateInput);
    if (typeof window.Textarea !== 'undefined')
      registerComponent('Textarea', window.Textarea);
    if (typeof window.Checkbox !== 'undefined')
      registerComponent('Checkbox', window.Checkbox);
  } else if (name === 'DataTable' && typeof window.DataTable !== 'undefined') {
    registerComponent('DataTable', window.DataTable);
  } else if (name === 'Button' && typeof window.Button !== 'undefined') {
    registerComponent('Button', window.Button);
    if (typeof window.PrimaryButton !== 'undefined')
      registerComponent('PrimaryButton', window.PrimaryButton);
    if (typeof window.SecondaryButton !== 'undefined')
      registerComponent('SecondaryButton', window.SecondaryButton);
    if (typeof window.DangerButton !== 'undefined')
      registerComponent('DangerButton', window.DangerButton);
    if (typeof window.SuccessButton !== 'undefined')
      registerComponent('SuccessButton', window.SuccessButton);
    if (typeof window.OutlineButton !== 'undefined')
      registerComponent('OutlineButton', window.OutlineButton);
    if (typeof window.GhostButton !== 'undefined')
      registerComponent('GhostButton', window.GhostButton);
    if (typeof window.LinkButton !== 'undefined')
      registerComponent('LinkButton', window.LinkButton);
  } else {
    console.warn(`⚠️ Component ${name} not found after loading script`);
  }
}

/**
 * Auto-load commonly used components
 * This ensures core components are available immediately after index.js loads
 */
function autoLoadCoreComponents() {
  return loadComponents([
    'Modal',
    'SearchBar',
    'Badge',
    'FormComponents',
    'DataTable',
    'Button',
  ]);
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ComponentRegistry,
    registerComponent,
    getComponent,
    loadComponents,
    autoLoadCoreComponents,
  };
}

// Make available globally and auto-load core components
if (typeof window !== 'undefined') {
  window.NightingaleComponentLibrary = {
    ComponentRegistry,
    registerComponent,
    getComponent,
    loadComponents,
    autoLoadCoreComponents,
  };

  // Auto-load core components when this script loads
  // This ensures Modal, SearchBar, Badge, Form components, DataTable, and Button are immediately available
  document.addEventListener('DOMContentLoaded', () => {
    autoLoadCoreComponents()
      .then(() => {
        console.log(
          '🎯 Nightingale Core Components Loaded: Modal, SearchBar, Badge, FormComponents, DataTable, Button'
        );
      })
      .catch((error) => {
        console.error('❌ Failed to load core components:', error);
      });
  });

  // If DOM is already loaded, load immediately
  if (document.readyState === 'loading') {
    // DOM still loading, event listener above will handle it
  } else {
    // DOM already loaded, load components now
    autoLoadCoreComponents()
      .then(() => {
        console.log(
          '🎯 Nightingale Core Components Loaded: Modal, SearchBar, Badge, FormComponents, DataTable, Button'
        );
      })
      .catch((error) => {
        console.error('❌ Failed to load core components:', error);
      });
  }
}
