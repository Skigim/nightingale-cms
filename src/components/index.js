/**
 * Nightingale Component Library - Main Index
 *
 * Orchestrates loading of both UI (generic) and Business (domain-specific) component layers
 * This provides a clean separation between reusable UI components and business logic
 */

/**
 * Component Library Structure:
 *
 * 📁 js/
 * ├── 📁 components/            <- All component files
 * │   ├── 🎨 ui/               <- Generic UI components (potential standalone library)
 * │   │   ├── index.js         <- UI component loader
 * │   │   ├── Button.js
 * │   │   ├── Badge.js
 * │   │   ├── DataTable.js
 * │   │   ├── FormComponents.js
 * │   │   ├── SearchBar.js
 * │   │   └── 📁 modals/
 * │   │       ├── Modal.js     <- Base modal component
 * │   │       └── StepperModal.js <- Generic stepper modal
 * │   │
 * │   ├── 🏢 business/         <- Domain-specific components (CMS business logic)
 * │   │   ├── index.js         <- Business component loader
 * │   │   └── 📁 modals/
 * │   │       ├── CaseCreationModal.js     <- Case creation workflow
 * │   │       ├── CaseCreationModal.js     <- Case creation workflow (with integrated steps)
 * │   │       ├── FinancialItemModal.js    <- (Future) Financial management
 * │   │       ├── PersonDetailsModal.js    <- (Future) Person management
 * │   │       └── CasePreviewModal.js      <- (Future) Case preview
 * │   │
 * │   └── index.js             <- This file: orchestrates both layers
 * │
 * └── 📁 services/             <- Nightingale services and utilities
 *     ├── nightingale.dayjs.js        <- Date/time utilities
 *     ├── nightingale.fileservice.js  <- File I/O operations
 *     ├── nightingale.parsers.js      <- Data parsing and validation
 *     ├── nightingale.search.js       <- Search and filtering
 *     ├── nightingale.toast.js        <- Toast notifications
 *     └── nightingale.utils.js        <- General utilities
 */

// Global Component Registry (for backward compatibility)
window.NightingaleComponentLibrary = window.NightingaleComponentLibrary || {
  ui: {},
  business: {},
  loaded: [],
  version: '2.0.0',

  // Register a component in the appropriate layer
  registerComponent(name, component, layer = 'ui') {
    if (layer === 'ui') {
      this.ui[name] = component;
      // Also register in UI registry
      if (window.NightingaleUI) {
        window.NightingaleUI.registerComponent(name, component);
      }
    } else if (layer === 'business') {
      this.business[name] = component;
      // Also register in business registry
      if (window.NightingaleBusiness) {
        window.NightingaleBusiness.registerComponent(name, component);
      }
    }

    // Maintain global access for backward compatibility
    window[name] = component;

    this.loaded.push({ name, layer, timestamp: Date.now() });
    console.log(`📦 Component registered: ${name} (${layer} layer)`);
  },

  // Get a component from any layer
  getComponent(name) {
    return this.ui[name] || this.business[name] || window[name] || null;
  },

  // List all loaded components
  listComponents() {
    return this.loaded;
  },

  // Check readiness of both layers
  isReady() {
    return (
      window.NightingaleUI?.loaded.length > 0 &&
      window.NightingaleBusiness?.loaded.length > 0
    );
  },
};

/**
 * Load Component Layers
 * Loads UI layer first, then business layer
 */
async function loadComponentLayers() {
  console.log(
    '🚀 Nightingale Component Library - Loading Layered Architecture...'
  );

  try {
    // Load UI layer first (generic components)
    console.log('🎨 Phase 1: Loading UI Component Layer...');
    const uiScript = document.createElement('script');
    uiScript.src = '/src/components/ui/index.js';
    uiScript.async = true;

    await new Promise((resolve, reject) => {
      uiScript.onload = resolve;
      uiScript.onerror = reject;
      document.head.appendChild(uiScript);
    });

    // Wait for UI components to be ready
    await new Promise((resolve) => {
      if (window.NightingaleUI?.loaded.length > 0) {
        resolve();
      } else {
        window.addEventListener('nightingale:ui:ready', resolve, {
          once: true,
        });
      }
    });

    // Load business layer (domain-specific components)
    console.log('🏢 Phase 2: Loading Business Component Layer...');
    const businessScript = document.createElement('script');
    businessScript.src = '/src/components/business/index.js';
    businessScript.async = true;

    await new Promise((resolve, reject) => {
      businessScript.onload = resolve;
      businessScript.onerror = reject;
      document.head.appendChild(businessScript);
    });

    // Wait for business components to be ready
    await new Promise((resolve) => {
      if (window.NightingaleBusiness?.loaded.length > 0) {
        resolve();
      } else {
        window.addEventListener('nightingale:business:ready', resolve, {
          once: true,
        });
      }
    });

    console.log('🎯 Nightingale Component Library - Fully Loaded!');
    console.log(
      `   🎨 UI Components: ${window.NightingaleUI?.loaded.length || 0}`
    );
    console.log(
      `   🏢 Business Components: ${window.NightingaleBusiness?.loaded.length || 0}`
    );

    // Dispatch event for when everything is ready
    window.dispatchEvent(
      new CustomEvent('nightingale:ready', {
        detail: {
          ui: window.NightingaleUI?.loaded || [],
          business: window.NightingaleBusiness?.loaded || [],
          timestamp: Date.now(),
        },
      })
    );
  } catch (error) {
    console.error('❌ Failed to load component layers:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
function autoLoadCoreComponents() {
  return loadComponentLayers();
}

// Make available globally
if (typeof window !== 'undefined') {
  window.loadNightingaleComponents = loadComponentLayers;
  window.autoLoadCoreComponents = autoLoadCoreComponents; // Backward compatibility

  // Auto-load when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadComponentLayers().catch(console.error);
    });
  } else {
    // DOM already loaded
    loadComponentLayers().catch(console.error);
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadComponentLayers,
    autoLoadCoreComponents, // Backward compatibility
  };
}
