/**
 * NightingaleCMSApp.js - Main application component
 *
 * Root business component for the Nightingale CMS application.
 * Manages global state, services, and orchestrates all other components.
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

// Direct ES module imports for primary tab components (eliminates reliance on global registry lookups)
import DashboardTab from './DashboardTab.js';
import CasesTab from './CasesTab.js';
import PeopleTab from './PeopleTab.js';
import OrganizationsTab from './OrganizationsTab.js';
import EligibilityTab from './EligibilityTab.js';
import { registerComponent, getComponent } from '../../services/core';
// Keep Header / Sidebar / SettingsModal via global for now (can be migrated later)

/**
 * NightingaleCMSApp Component
 * Main application component with global state management
 *
 * @returns {React.Element} NightingaleCMSApp component
 */
function NightingaleCMSApp() {
  const e = window.React?.createElement;
  const { useState, useEffect, useRef, useMemo, useCallback } =
    window.React || {};

  // Main application state - hooks must be called unconditionally
  const [fullData, setFullData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fileStatus, setFileStatus] = useState('disconnected');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [caseViewMode, setCaseViewMode] = useState('list'); // Track if we're in case details view
  const [caseBackFunction, setCaseBackFunction] = useState(null); // Function to go back from case details
  // TODO: Implement people and organizations navigation in sidebar
  // const [peopleViewMode, setPeopleViewMode] = useState('list'); // Track if we're in person details view
  // const [peopleBackFunction, setPeopleBackFunction] = useState(null); // Function to go back from person details
  // const [organizationsViewMode, setOrganizationsViewMode] = useState('list'); // Track if we're in organization details view
  // const [organizationsBackFunction, setOrganizationsBackFunction] = useState(null); // Function to go back from organization details

  // Autosave & File service state (combined)
  const [autosaveFileService, setAutosaveFileService] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState({
    status: 'disconnected',
    message: 'Service not initialized',
  });

  // Use ref for live data access to avoid stale closure issues
  const fullDataRef = useRef(null);

  // Data update handler - must be defined before useMemo that uses it
  const handleDataUpdate = useCallback((newData) => {
    setFullData(newData);
  }, []);

  // Keep ref synchronized with state
  useEffect(() => {
    fullDataRef.current = fullData;
  }, [fullData]);

  // Backward compatibility aliases
  const fileService = autosaveFileService; // For components that expect fileService
  const [servicesReady, setServicesReady] = useState(false);

  // Memoize non-tab components (tabs imported directly above)
  const components = useMemo(
    () => ({
      Sidebar: getComponent('ui', 'Sidebar'),
      Header: getComponent('ui', 'Header'),
      SettingsModal: getComponent('business', 'SettingsModal'),
    }),
    [],
  );

  // Memoize tab props to prevent unnecessary re-renders of heavy tab components
  const tabProps = useMemo(
    () => ({
      dashboard: { fullData },
      cases: {
        fullData,
        onUpdateData: handleDataUpdate,
        fileService,
        onViewModeChange: setCaseViewMode,
        onBackToList: setCaseBackFunction,
      },
      people: {
        fullData,
        onUpdateData: handleDataUpdate,
        fileService,
        // TODO: Add navigation props when sidebar supports people back button
        // onViewModeChange: setPeopleViewMode,
        // onBackToList: setPeopleBackFunction,
      },
      organizations: {
        fullData,
        onUpdateData: handleDataUpdate,
        fileService,
        // TODO: Add navigation props when sidebar supports organizations back button
        // onViewModeChange: setOrganizationsViewMode,
        // onBackToList: setOrganizationsBackFunction,
      },
      eligibility: { fullData },
    }),
    [
      fullData,
      fileService,
      handleDataUpdate,
      setCaseViewMode,
      setCaseBackFunction,
    ],
  );

  // Memoize service status to optimize conditional rendering
  const serviceStatus = useMemo(
    () => ({
      isReady: servicesReady && !!fileService,
      hasAutosave: !!autosaveFileService,
      canSave: !!fileService?.saveData,
      isLoading: !servicesReady || !fileService,
    }),
    [servicesReady, fileService, autosaveFileService],
  );

  // Toast function - now guaranteed to work by main.js setup
  const showToast = window.showToast;

  // Initialize combined autosave & file service when services are ready
  useEffect(() => {
    const handleServicesReady = () => {
      if (typeof window.AutosaveFileService !== 'undefined') {
        // Use the clean factory method for React integration
        const service = window.AutosaveFileService.createForReact({
          tabId: `cms-react-tab-${Date.now()}`,
          errorCallback: showToast,
          sanitizeFn:
            typeof window.sanitize !== 'undefined'
              ? window.sanitize
              : (str) => str,

          // Autosave configuration
          enabled: true,
          saveInterval: 120000, // 2 minutes
          debounceDelay: 5000, // 5 seconds
          maxRetries: 3,

          // React integration - use ref for live data access
          getFullData: () => {
            return fullDataRef.current;
          },

          // Status updates
          onStatusChange: (status) => {
            setAutosaveStatus(status);
          },
        });
        setAutosaveFileService(service);
        setServicesReady(true);
      } else {
        setTimeout(handleServicesReady, 1000);
      }
    };

    // Listen for services ready event
    window.addEventListener('nightingale:services:ready', handleServicesReady);

    // Also check if already ready
    if (typeof window.AutosaveFileService !== 'undefined') {
      handleServicesReady();
    }

    return () => {
      window.removeEventListener(
        'nightingale:services:ready',
        handleServicesReady,
      );
    };
  }, [showToast]);

  // Handle manual save
  const handleManualSave = async () => {
    if (serviceStatus.canSave) {
      try {
        await fileService.saveData();
        showToast('Data saved successfully', 'success');
      } catch (error) {
        const logger = window.NightingaleLogger?.get('cms:manualSave');
        logger?.error('Manual save failed', { error: error.message });
        showToast('Failed to save data', 'error');
      }
    } else {
      showToast('Save service not available', 'warning');
    }
  };

  // Handle data updates from children
  const handleDataLoaded = useCallback((data) => {
    setFullData(data);
  }, []);

  // Render active tab using direct component references to avoid invalid hook context issues
  const renderActiveTab = () => {
    const props = tabProps[activeTab] || {};
    switch (activeTab) {
      case 'dashboard':
        return e(DashboardTab, props);
      case 'cases':
        return e(CasesTab, props);
      case 'people':
        return e(PeopleTab, props);
      case 'organizations':
        return e(OrganizationsTab, props);
      case 'eligibility':
        return e(EligibilityTab, props);
      default:
        return e(
          'div',
          { className: 'p-4 text-center text-gray-400' },
          'Select a tab',
        );
    }
  };

  // React safety check for render
  if (!window.React) {
    return null;
  }

  // Show loading screen while services are initializing
  if (serviceStatus.isLoading) {
    return e(
      'div',
      {
        className:
          'h-screen w-screen flex items-center justify-center bg-gray-900 text-white',
        style: { fontFamily: 'Inter, system-ui, sans-serif' },
      },
      e(
        'div',
        { className: 'text-center space-y-4' },
        e('div', {
          className:
            'animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto',
        }),
        e(
          'h2',
          { className: 'text-xl font-semibold' },
          'Initializing Nightingale CMS',
        ),
        e(
          'p',
          { className: 'text-gray-400' },
          'Loading services and file system...',
        ),
      ),
    );
  }

  return e(
    'div',
    { className: 'h-screen w-screen flex' },
    components.Sidebar &&
      e(components.Sidebar, {
        activeTab,
        onTabChange: setActiveTab,
        onSettingsClick: () => setIsSettingsOpen(true),
        caseViewMode,
        onCaseBackToList: () => {
          if (caseBackFunction) {
            caseBackFunction();
          }
        },
      }),
    e(
      'div',
      { className: 'flex-1 flex flex-col overflow-hidden' },
      components.Header &&
        e(components.Header, {
          fileStatus,
          autosaveStatus,
          onSettingsClick: () => setIsSettingsOpen(true),
          onManualSave: handleManualSave,
        }),
      e(
        'main',
        { className: 'flex-1 overflow-auto p-6 bg-gray-900' },
        renderActiveTab(),
      ),
    ),
    // Settings Modal
    components.SettingsModal &&
      e(components.SettingsModal, {
        isOpen: isSettingsOpen,
        onClose: () => setIsSettingsOpen(false),
        fileService,
        onDataLoaded: handleDataLoaded,
        fileStatus,
        onFileStatusChange: setFileStatus,
      }),
  );
}

// PropTypes for validation
if (typeof window !== 'undefined' && window.PropTypes) {
  NightingaleCMSApp.propTypes = {
    // NightingaleCMSApp is the root component and doesn't receive external props
    // All props are managed internally through state
  };
}

// Self-registration for both module and script loading
if (typeof window !== 'undefined') {
  window.NightingaleCMSApp = NightingaleCMSApp; // legacy global
  registerComponent('business', 'NightingaleCMSApp', NightingaleCMSApp);
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NightingaleCMSApp;
}

// ES6 Module Export
export default NightingaleCMSApp;
