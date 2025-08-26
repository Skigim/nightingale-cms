// Nightingale Business Component Library - Domain-Specific Components
// This layer contains components with business logic specific to the Nightingale CMS

/**
 * Nightingale Business Component Library Loader
 * Loads all business-specific components that contain domain logic
 * These components are specific to case management and use the UI components
 */

// Business Component Loading Configuration
const BUSINESS_COMPONENTS = [
  // Case Management Modals
  {
    name: 'CaseCreationModal',
    path: 'CaseCreationModal.js',
    category: 'case-management',
    dependencies: ['StepperModal', 'FormComponents'],
  },
  {
    name: 'PersonCreationModal',
    path: 'PersonCreationModal.js',
    category: 'people-management',
    dependencies: ['StepperModal', 'FormComponents'],
  },
  {
    name: 'OrganizationModal',
    path: 'OrganizationModal.js',
    category: 'organization-management',
    dependencies: ['StepperModal', 'FormComponents'],
  },

  {
    name: 'FinancialItemCard',
    path: 'FinancialItemCard.js',
    category: 'financial',
    dependencies: ['Cards', 'Badge', 'Button'],
  },

  {
    name: 'NotesModal',
    path: 'NotesModal.js',
    category: 'business',
    dependencies: [],
  },

  // Additional business components:
  {
    name: 'AvsImportModal',
    path: 'AvsImportModal.js',
    category: 'financial',
    dependencies: ['Modal', 'FormComponents', 'Button'],
  },
  {
    name: 'FinancialManagementSection',
    path: 'FinancialManagementSection.js',
    category: 'financial',
    dependencies: ['FinancialItemCard'],
  },
  {
    name: 'DashboardTab',
    path: 'DashboardTab.js',
    category: 'dashboard',
    dependencies: [],
  },
  {
    name: 'OrganizationsTab',
    path: 'OrganizationsTab.js',
    category: 'organization-management',
    dependencies: ['TabBase', 'DataTable', 'Button', 'SearchBar'],
  },
  {
    name: 'FinancialItemModal',
    path: 'FinancialItemModal.js',
    category: 'financial',
    dependencies: ['Modal', 'FormComponents'],
  },
  {
    name: 'CasesTab',
    path: 'CasesTab.js',
    category: 'case-management',
    dependencies: ['TabBase', 'DataTable', 'SearchBar', 'TabHeader'],
  },
  {
    name: 'PeopleTab',
    path: 'PeopleTab.js',
    category: 'people-management',
    dependencies: ['TabBase', 'DataTable', 'SearchBar', 'TabHeader'],
  },
  {
    name: 'EligibilityTab',
    path: 'EligibilityTab.js',
    category: 'eligibility',
    dependencies: [],
  },

  // Future business components will be added here:
  // { name: 'PersonDetailsModal', path: 'business/modals/PersonDetailsModal.js', category: 'people' },
  // { name: 'CasePreviewModal', path: 'business/modals/CasePreviewModal.js', category: 'case-management' },
  // { name: 'SettingsModal', path: 'business/modals/SettingsModal.js', category: 'system' },
];

// Business Component Registry
window.NightingaleBusiness = window.NightingaleBusiness || {
  components: {},
  loaded: [],
  dependencies: {},
  version: '1.0.0',

  // Register a business component
  registerComponent(name, component, category = 'business', dependencies = []) {
    this.components[name] = component;
    this.dependencies[name] = dependencies;
    this.loaded.push({ name, category, dependencies, timestamp: Date.now() });
  },

  // Get a business component
  getComponent(name) {
    return this.components[name];
  },

  // List all loaded business components
  listComponents() {
    return this.loaded;
  },

  // Check if component is loaded
  isLoaded(name) {
    return !!this.components[name];
  },

  // Check if all dependencies are loaded
  checkDependencies(name) {
    const deps = this.dependencies[name] || [];
    return deps.every(
      (dep) => window.NightingaleUI?.isLoaded(dep) || this.isLoaded(dep)
    );
  },
};

/**
 * Wait for UI components to be ready
 */
function waitForUIComponents() {
  return new Promise((resolve) => {
    if (window.NightingaleUI && window.NightingaleUI.loaded.length > 0) {
      resolve();
    } else {
      window.addEventListener('nightingale:ui:ready', resolve, { once: true });
    }
  });
}

/**
 * Load Business Components
 * Dynamically loads all business-specific components after UI components are ready
 */
async function loadBusinessComponents() {
  // Wait for UI components to be loaded first
  await waitForUIComponents();

  const loadPromises = BUSINESS_COMPONENTS.map(
    async ({ name, path, category, dependencies }) => {
      try {
        // Create script element for component
        const script = document.createElement('script');
        script.src = `../components/business/${path}`; // Make path relative to the page location
        script.async = true; // Return promise that resolves when script loads
        return new Promise((resolve, reject) => {
          script.onload = () => {
            resolve({ name, category, dependencies, status: 'loaded' });
          };
          script.onerror = () => {
            console.error(`❌ Failed to load business component: ${name}`);
            reject(new Error(`Failed to load ${name}`));
          };
          document.head.appendChild(script);
        });
      } catch (error) {
        console.error(`❌ Error loading business component ${name}:`, error);
        throw error;
      }
    }
  );

  try {
    const results = await Promise.all(loadPromises);

    // Dispatch event for when business library is ready
    window.dispatchEvent(
      new CustomEvent('nightingale:business:ready', {
        detail: { components: results, timestamp: Date.now() },
      })
    );

    return results;
  } catch (error) {
    console.error('❌ Failed to load business component library:', error);
    throw error;
  }
}

/**
 * Initialize Business Component Library
 * Call this to start loading the business components
 */
if (typeof window !== 'undefined') {
  // Auto-load business components when this script loads
  loadBusinessComponents().catch(console.error);

  // Make loader available globally for manual loading
  window.loadNightingaleBusiness = loadBusinessComponents;
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadBusinessComponents, BUSINESS_COMPONENTS };
}
