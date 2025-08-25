/**
 * Nightingale Services Registry - Auto-loader for all services
 *
 * This file orchestrates the loading of all Nightingale services in the correct order,
 * ensuring dependencies are resolved and all services are properly registered.
 */

/**
 * Service Loading Architecture:
 *
 * 📁 js/services/
 * ├── 🔧 Core Services (loaded first)
 * │   ├── nightingale.coreutilities.js <- Security, formatting, validation utilities
 * │   ├── nightingale.dayjs.js        <- Date/time utilities
 * │   └── nightingale.parsers.js      <- Data parsing
 * │
 * ├── 💾 Data Services (loaded second)
 * │   ├── nightingale.fileservice.js  <- File I/O operations
 * │   ├── nightingale.search.js       <- Search and filtering
 * │   └── nightingale.datamanagement.js <- Data management
 * │
 * ├── 🎨 UI Services (loaded third)
 * │   ├── nightingale.toast.js        <- Toast notifications
 * │   ├── nightingale.clipboard.js    <- Clipboard operations
 * │   └── nightingale.uiutilities.js  <- UI interaction utilities
 * │
 * └── 📄 Business Services (loaded last)
 *     ├── nightingale.cmsutilities.js     <- CMS business logic
 *     ├── nightingale.placeholders.js    <- Placeholder processing
 *     ├── nightingale.templates.js       <- Template management
 *     └── nightingale.documentgeneration.js <- Document generation
 */

// Global Services Registry
window.NightingaleServices = window.NightingaleServices || {
  core: {},
  data: {},
  ui: {},
  business: {},
  loaded: [],
  version: '2.0.0',

  // Register a service in the appropriate category
  registerService(name, service, category = 'core') {
    this[category][name] = service;

    // Maintain global access for backward compatibility
    window[`Nightingale${name}`] = service;

    this.loaded.push({
      name,
      category,
      timestamp: Date.now(),
      version: service.version || '1.0.0',
    });

    console.debug(`⚙️ Service registered: ${name} (${category} category)`);
  },

  // Get a service from any category
  getService(name) {
    return (
      this.core[name] ||
      this.data[name] ||
      this.ui[name] ||
      this.business[name] ||
      null
    );
  },

  // List all loaded services
  listServices() {
    return this.loaded;
  },

  // Check if all critical services are loaded
  isReady() {
    const criticalServices = [
      'PlaceholderService',
      'TemplateService',
      'DocumentGenerationService',
    ];
    return criticalServices.every((service) =>
      this.getService(service.replace('Service', ''))
    );
  },

  // Get services by category
  getByCategory(category) {
    return this[category] || {};
  },
};

/**
 * Service Loading Configuration
 * Defines load order and dependencies
 */
const SERVICE_LOAD_ORDER = [
  // Phase 1: Core Services (no dependencies)
  {
    phase: 'core',
    services: [
      'nightingale.coreutilities.js', // New: Core utilities (security, formatting, validation)
      'nightingale.dayjs.js',
      'nightingale.parsers.js',
    ],
  },

  // Phase 2: Data Services (depend on core)
  {
    phase: 'data',
    services: [
      'nightingale.fileservice.js',
      'nightingale.search.js',
      'nightingale.datamanagement.js',
    ],
  },

  // Phase 3: UI Services (depend on core + data)
  {
    phase: 'ui',
    services: [
      'nightingale.toast.js',
      'nightingale.clipboard.js', // New: Dedicated clipboard service
      'nightingale.uiutilities.js', // New: UI interaction utilities
    ],
  },

  // Phase 4: Business Services (depend on all above)
  {
    phase: 'business',
    services: [
      'nightingale.cmsutilities.js', // CMS business logic only
      'nightingale.placeholders.js',
      'nightingale.templates.js',
      'nightingale.documentgeneration.js',
    ],
  },
];

/**
 * Load a single service file
 */
async function loadService(servicePath) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `js/services/${servicePath}`;
    script.async = true;

    script.onload = () => {
      console.debug(`✅ Loaded: ${servicePath}`);
      resolve(servicePath);
    };

    script.onerror = (error) => {
      console.error(`❌ Failed to load: ${servicePath}`, error);
      reject(new Error(`Failed to load service: ${servicePath}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Load services in phases with dependency resolution
 */
async function loadServicesInPhases() {
  console.info(
    '🚀 Nightingale Services - Loading with dependency resolution...'
  );

  try {
    for (const phase of SERVICE_LOAD_ORDER) {
      console.debug(
        `📦 Phase ${phase.phase}: Loading ${phase.services.length} service(s)...`
      );

      // Load all services in this phase in parallel
      const promises = phase.services.map((service) => loadService(service));
      await Promise.all(promises);

      // Wait a moment for services to register themselves
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.debug(`✅ Phase ${phase.phase}: Complete`);
    }

    console.info('🎯 All Nightingale Services Loaded Successfully!');
    console.debug(
      `   ⚙️ Total Services: ${window.NightingaleServices.loaded.length}`
    );

    // Log service summary by category
    Object.keys(window.NightingaleServices).forEach((category) => {
      if (
        typeof window.NightingaleServices[category] === 'object' &&
        category !== 'loaded' &&
        category !== 'version'
      ) {
        const count = Object.keys(window.NightingaleServices[category]).length;
        if (count > 0) {
          console.debug(`   📁 ${category}: ${count} service(s)`);
        }
      }
    });

    // Dispatch ready event
    window.dispatchEvent(
      new CustomEvent('nightingale:services:ready', {
        detail: {
          services: window.NightingaleServices.loaded,
          timestamp: Date.now(),
        },
      })
    );

    return true;
  } catch (error) {
    console.error('❌ Failed to load services:', error);
    throw error;
  }
}

/**
 * Enhanced service loader with error recovery
 */
async function loadNightingaleServices(options = {}) {
  const { retryCount = 3, retryDelay = 1000 } = options;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      await loadServicesInPhases();
      return true;
    } catch (error) {
      console.warn(
        `⚠️ Service loading attempt ${attempt}/${retryCount} failed:`,
        error.message
      );

      if (attempt < retryCount) {
        console.debug(`🔄 Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        console.error('💥 All service loading attempts failed');
        throw error;
      }
    }
  }
}

/**
 * Check service dependencies and provide status
 */
function checkServiceDependencies() {
  const status = {
    core: [],
    data: [],
    ui: [],
    business: [],
    missing: [],
    ready: false,
  };

  // Check each category
  SERVICE_LOAD_ORDER.forEach((phase) => {
    phase.services.forEach((serviceFile) => {
      const serviceName = serviceFile
        .replace('nightingale.', '')
        .replace('.js', '');
      const isLoaded =
        window.NightingaleServices.getService(serviceName) !== null;

      if (isLoaded) {
        status[phase.phase].push(serviceName);
      } else {
        status.missing.push(serviceName);
      }
    });
  });

  status.ready = status.missing.length === 0;

  return status;
}

// Legacy compatibility function
function autoLoadServices() {
  return loadNightingaleServices();
}

// Make available globally
if (typeof window !== 'undefined') {
  window.loadNightingaleServices = loadNightingaleServices;
  window.checkServiceDependencies = checkServiceDependencies;
  window.autoLoadServices = autoLoadServices; // Backward compatibility

  // Auto-load when DOM is ready (only if not already loading)
  if (!window.nightingaleServicesLoading) {
    window.nightingaleServicesLoading = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        loadNightingaleServices().catch(console.error);
      });
    } else {
      // DOM already loaded, start immediately
      loadNightingaleServices().catch(console.error);
    }
  }
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadNightingaleServices,
    checkServiceDependencies,
    autoLoadServices,
  };
}

// Debug utilities available in console
window.debugNightingaleServices = function () {
  console.groupCollapsed('🔍 Nightingale Services Debug');
  console.debug('Loaded Services:', window.NightingaleServices.loaded);
  console.debug('Dependencies Status:', checkServiceDependencies());
  console.debug('Service Registry:', window.NightingaleServices);
  console.groupEnd();
};

console.info(
  '📋 Services registry initialized. Use debugNightingaleServices() for status.'
);
