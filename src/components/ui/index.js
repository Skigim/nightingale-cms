// Nightingale UI Component Library - Generic UI Components
// This is the generic, reusable UI layer that could be compiled into a standalone library

/**
 * Nightingale UI Component Library Loader
 * Loads all generic UI components that are framework-agnostic and reusable
 * These components have no business logic and can be used in any React application
 */

// UI Component Loading Configuration
const UI_COMPONENTS = [
  // Core UI Components
  { name: 'Button', path: 'Button.js', category: 'core' },
  { name: 'Badge', path: 'Badge.js', category: 'core' },
  { name: 'Cards', path: 'Cards.js', category: 'core' },
  {
    name: 'SearchBar',
    path: 'SearchBar.js',
    category: 'core',
  },
  {
    name: 'FormComponents',
    path: 'FormComponents.js',
    category: 'forms',
  },
  {
    name: 'DataTable',
    path: 'DataTable.js',
    category: 'data',
  },

  // Modal Components
  {
    name: 'Modal',
    path: 'Modal.js',
    category: 'modals',
  },
  {
    name: 'StepperModal',
    path: 'StepperModal.js',
    category: 'modals',
  },

  // Component Factories and Utilities
  {
    name: 'TabBase',
    path: 'TabBase.js',
    category: 'factories',
  },
  {
    name: 'TabHeader',
    path: 'TabHeader.js',
    category: 'layout',
  },
]; // UI Component Registry
window.NightingaleUI = window.NightingaleUI || {
  components: {},
  loaded: [],
  version: '1.0.0',

  // Register a UI component
  registerComponent(name, component, category = 'core') {
    this.components[name] = component;
    this.loaded.push({ name, category, timestamp: Date.now() });
    console.log(`🎨 UI Component registered: ${name} (${category})`);
  },

  // Get a UI component
  getComponent(name) {
    return this.components[name];
  },

  // List all loaded UI components
  listComponents() {
    return this.loaded;
  },

  // Check if component is loaded
  isLoaded(name) {
    return !!this.components[name];
  },
};

/**
 * Load UI Components
 * Dynamically loads all generic UI components
 */
async function loadUIComponents() {
  console.log('🎨 Loading Nightingale UI Component Library...');

  const loadPromises = UI_COMPONENTS.map(async ({ name, path, category }) => {
    try {
      console.log(`🔄 Loading UI component: ${name} (${category})`);

      // Create script element for component
      const script = document.createElement('script');
      script.src = path; // path already includes full js/components/ui/ prefix
      script.async = true;

      // Return promise that resolves when script loads
      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log(`✅ UI component loaded: ${name}`);
          resolve({ name, category, status: 'loaded' });
        };
        script.onerror = () => {
          console.error(`❌ Failed to load UI component: ${name}`);
          reject(new Error(`Failed to load ${name}`));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error(`❌ Error loading UI component ${name}:`, error);
      throw error;
    }
  });

  try {
    const results = await Promise.all(loadPromises);
    console.log(
      `🎨 Nightingale UI Library loaded successfully! (${results.length} components)`
    );

    // Dispatch event for when UI library is ready
    window.dispatchEvent(
      new CustomEvent('nightingale:ui:ready', {
        detail: { components: results, timestamp: Date.now() },
      })
    );

    return results;
  } catch (error) {
    console.error('❌ Failed to load UI component library:', error);
    throw error;
  }
}

/**
 * Initialize UI Component Library
 * Call this to start loading the UI components
 */
if (typeof window !== 'undefined') {
  // Auto-load UI components when this script loads
  loadUIComponents().catch(console.error);

  // Make loader available globally for manual loading
  window.loadNightingaleUI = loadUIComponents;
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadUIComponents, UI_COMPONENTS };
}
