/**
 * app-init.js - Application initialization service
 * 
 * Handles the initialization of the Nightingale CMS React application.
 * Waits for services and components to load before rendering the main app.
 * 
 * @namespace NightingaleServices
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * Initialize the Nightingale CMS Application
 * Waits for all dependencies to be ready before starting React
 */
async function initializeNightingaleCMS() {
  // React safety check
  if (!window.React || !window.ReactDOM) {
    console.error('❌ React or ReactDOM not available');
    return;
  }

  const e = window.React.createElement;
  const { createRoot } = window.ReactDOM;

  try {
    console.log('🚀 Initializing Nightingale CMS...');

    // Wait for services to be ready first
    await waitForServices();

    // Wait for components to be available
    await waitForComponents();

    // Get the main app component
    const NightingaleCMSApp = window.NightingaleCMSApp || window.NightingaleBusiness?.getComponent?.('NightingaleCMSApp');
    
    if (!NightingaleCMSApp) {
      throw new Error('NightingaleCMSApp component not available');
    }

    // Render the application
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = createRoot(rootElement);
    root.render(e(NightingaleCMSApp));

    // Store app instance globally for debugging
    window.nightingaleCMSApp = root;
    
    console.log('✅ Nightingale CMS initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize Nightingale CMS:', error);
    
    // Fallback rendering
    try {
      const rootElement = document.getElementById('root');
      if (rootElement && window.NightingaleCMSApp) {
        const root = createRoot(rootElement);
        root.render(e(window.NightingaleCMSApp));
        window.nightingaleCMSApp = root;
        console.log('🔄 Fallback initialization successful');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback initialization also failed:', fallbackError);
    }
  }
}

/**
 * Wait for Nightingale services to be ready
 */
function waitForServices() {
  return new Promise((resolve) => {
    let servicesReady = false;
    
    const checkServicesReady = () => {
      servicesReady =
        typeof window.AutosaveFileService !== 'undefined' &&
        typeof window.NightingaleServices !== 'undefined' &&
        (window.NightingaleServices.loaded?.length || 0) > 0;
      
      return servicesReady;
    };

    // Check if already ready
    if (checkServicesReady()) {
      console.log('✅ Services already ready');
      resolve();
      return;
    }

    // Listen for services ready event
    const handleServicesReady = () => {
      if (checkServicesReady()) {
        console.log('✅ Services are ready');
        window.removeEventListener('nightingale:services:ready', handleServicesReady);
        resolve();
      }
    };

    window.addEventListener('nightingale:services:ready', handleServicesReady);

    // Fallback timeout after 10 seconds
    setTimeout(() => {
      if (!servicesReady) {
        console.warn('⚠️ Services loading timeout, proceeding anyway');
        window.removeEventListener('nightingale:services:ready', handleServicesReady);
        resolve();
      }
    }, 10000);
  });
}

/**
 * Wait for component library to be available
 */
async function waitForComponents() {
  // Wait for components to be available (index.js auto-loads them)
  if (window.NightingaleComponentLibrary) {
    // Wait for auto-loading to complete by checking if components are registered
    let attempts = 0;
    while (attempts < 50) {
      // Max 5 seconds
      if (window.NightingaleComponentLibrary.getComponent('Button')) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (attempts >= 50) {
      console.warn('⚠️ Components took too long to load, proceeding anyway');
    } else {
      console.log('✅ Components are ready');
    }
  } else {
    console.warn('⚠️ Component library not found, proceeding with basic initialization');
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  // Make initialization function available globally
  window.initializeNightingaleCMS = initializeNightingaleCMS;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNightingaleCMS);
  } else {
    // DOM is already ready
    initializeNightingaleCMS();
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeNightingaleCMS, waitForServices, waitForComponents };
}