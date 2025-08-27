/**
 * NightingaleCMSApp.js - Main application component
 *
 * Root business component for the Nightingale CMS application.
 * Manages global state, services, and orchestrates all other components.
 *
 * @namespace NightingaleBusiness
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * NightingaleCMSApp Component
 * Main application component with global state management
 *
 * @returns {React.Element} NightingaleCMSApp component
 */
function NightingaleCMSApp() {
  const e = window.React?.createElement;
  const { useState, useEffect, useRef, useMemo } = window.React || {};

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

  // Keep ref synchronized with state
  useEffect(() => {
    fullDataRef.current = fullData;
  }, [fullData]);

  // Backward compatibility aliases
  const fileService = autosaveFileService; // For components that expect fileService
  const [servicesReady, setServicesReady] = useState(false);

  // Get component dependencies
  const Sidebar =
    window.Sidebar || window.NightingaleUI?.getComponent?.('Sidebar');
  const Header =
    window.Header || window.NightingaleUI?.getComponent?.('Header');
  const SettingsModal =
    window.SettingsModal ||
    window.NightingaleBusiness?.getComponent?.('SettingsModal');
  const showToast = useMemo(() => {
    return (
      window.showToast ||
      window.NightingaleToast?.show ||
      function (message, type) {
        console.log(`Toast ${type}: ${message}`);
      }
    );
  }, []);

  // Initialize combined autosave & file service when services are ready
  useEffect(() => {
    const handleServicesReady = () => {
      console.log('🎯 Services ready - initializing AutosaveFileService');
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
            console.log(
              '📦 Data provider called, ref contains:',
              !!fullDataRef.current
            );
            return fullDataRef.current;
          },

          // Status updates
          onStatusChange: (status) => {
            console.log('🔄 Autosave status change:', status);
            setAutosaveStatus(status);
          },
        });

        console.log('✅ AutosaveFileService initialized:', !!service);
        setAutosaveFileService(service);
        setServicesReady(true);
      } else {
        console.warn('⚠️ AutosaveFileService not available, retrying...');
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
        handleServicesReady
      );
    };
  }, [showToast]);

  // Handle manual save
  const handleManualSave = async () => {
    if (fileService?.saveData) {
      try {
        await fileService.saveData();
        showToast('Data saved successfully', 'success');
      } catch (error) {
        console.error('Manual save error:', error);
        showToast('Failed to save data', 'error');
      }
    }
  };

  // Handle data updates from children
  const handleDataLoaded = (data) => {
    console.log('📊 Data loaded from child component');
    setFullData(data);
  };

  const handleDataUpdate = (newData) => {
    console.log('📊 Data updated from child component');
    setFullData(newData);
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return window.DashboardTab
          ? e(window.DashboardTab, { fullData })
          : e(
              'div',
              { className: 'p-4 text-center text-gray-400' },
              'Dashboard component not loaded'
            );
      case 'cases':
        return window.CasesTab
          ? e(window.CasesTab, {
              fullData,
              onUpdateData: handleDataUpdate,
              fileService,
              onViewModeChange: setCaseViewMode,
              onBackToList: setCaseBackFunction,
            })
          : e(
              'div',
              { className: 'p-4 text-center text-gray-400' },
              'Cases component not loaded'
            );
      case 'people':
        return window.PeopleTab
          ? e(window.PeopleTab, {
              fullData,
              onUpdateData: handleDataUpdate,
              fileService,
              // TODO: Implement navigation when sidebar supports people back button
              // onViewModeChange: setPeopleViewMode,
              // onBackToList: setPeopleBackFunction,
            })
          : e(
              'div',
              { className: 'p-4 text-center text-gray-400' },
              'People component not loaded'
            );
      case 'organizations':
        return window.OrganizationsTab
          ? e(window.OrganizationsTab, {
              fullData,
              onUpdateData: handleDataUpdate,
              fileService,
              // TODO: Implement navigation when sidebar supports organizations back button
              // onViewModeChange: setOrganizationsViewMode,
              // onBackToList: setOrganizationsBackFunction,
            })
          : e(
              'div',
              { className: 'p-4 text-center text-gray-400' },
              'Organizations component not loaded'
            );
      case 'eligibility':
        return window.EligibilityTab
          ? e(window.EligibilityTab, { fullData })
          : e(
              'div',
              { className: 'p-4 text-center text-gray-400' },
              'Eligibility component not loaded'
            );
      default:
        return window.DashboardTab
          ? e(window.DashboardTab, { fullData })
          : e(
              'div',
              { className: 'p-4 text-center text-gray-400' },
              'Dashboard component not loaded'
            );
    }
  };

  // React safety check for render
  if (!window.React) {
    console.warn('React not available for NightingaleCMSApp component');
    return null;
  }

  // Show loading screen while services are initializing
  if (!servicesReady || !fileService) {
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
          'Initializing Nightingale CMS'
        ),
        e(
          'p',
          { className: 'text-gray-400' },
          'Loading services and file system...'
        )
      )
    );
  }

  return e(
    'div',
    { className: 'h-screen w-screen flex' },
    Sidebar &&
      e(Sidebar, {
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
      Header &&
        e(Header, {
          fileStatus,
          autosaveStatus,
          onSettingsClick: () => setIsSettingsOpen(true),
          onManualSave: handleManualSave,
        }),
      e(
        'main',
        { className: 'flex-1 overflow-auto p-6 bg-gray-900' },
        renderTabContent()
      )
    ),
    // Settings Modal
    SettingsModal &&
      e(SettingsModal, {
        isOpen: isSettingsOpen,
        onClose: () => setIsSettingsOpen(false),
        fileService,
        onDataLoaded: handleDataLoaded,
        fileStatus,
        onFileStatusChange: setFileStatus,
      })
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
  // Register globally for backward compatibility
  window.NightingaleCMSApp = NightingaleCMSApp;

  // Register with NightingaleBusiness registry if available
  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'NightingaleCMSApp',
      NightingaleCMSApp,
      'application'
    );
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NightingaleCMSApp;
}
