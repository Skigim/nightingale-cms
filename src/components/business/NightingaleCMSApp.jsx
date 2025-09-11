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
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import DashboardTab from './DashboardTab.jsx';
import CasesTab from './CasesTab.jsx';
import PeopleTab from './PeopleTab.jsx';
import OrganizationsTab from './OrganizationsTab.jsx';
import EligibilityTab from './EligibilityTab.jsx';
import { registerComponent, getComponent } from '../../services/registry';
import Toast from '../../services/nightingale.toast.js';
import { getFileService } from '../../services/fileServiceProvider.js';
// Keep Header / Sidebar / SettingsModal via global for now (can be migrated later)

/**
 * NightingaleCMSApp Component
 * Main application component with global state management
 *
 * @returns {React.Element} NightingaleCMSApp component
 */
function NightingaleCMSApp() {
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

  // File service instance (hydrated from provider)
  const [fileService, setFileServiceState] = useState(() => getFileService());

  // Derive autosave status (kept for Header prop compatibility)
  const autosaveStatus = useMemo(
    () => ({
      status: fileService ? 'ready' : 'disconnected',
      message: fileService ? 'Service initialized' : 'Service not initialized',
    }),
    [fileService],
  );

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

  // Listen for provider readiness events to hydrate service after mount
  useEffect(() => {
    const handler = () => {
      const svc = getFileService();
      if (svc && svc !== fileService) {
        setFileServiceState(svc);
      }
    };
    // Attempt immediate hydration (handles case where service set before mount)
    handler();
    if (typeof document !== 'undefined') {
      document.addEventListener('fileService:ready', handler);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('fileService:ready', handler);
      }
    };
    // fileService intentionally excluded from deps to avoid stale removal/add cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      isReady: !!fileService,
      hasAutosave: !!fileService, // unified service now
      canSave: !!fileService?.saveData,
      isLoading: false,
    }),
    [fileService],
  );

  // Toast function - module based
  const showToast = (msg, type) => Toast.showToast?.(msg, type);

  // (Legacy services ready listener removed) Autosave/file service will now be
  // initialized elsewhere; component renders immediately.

  // Handle manual save
  const handleManualSave = async () => {
    if (serviceStatus.canSave) {
      try {
        await fileService.saveData();
        showToast('Data saved successfully', 'success');
      } catch (error) {
        const logger = globalThis.NightingaleLogger?.get('cms:manualSave');
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

  // Render active tab using lookup mapping (JSX friendly)
  const renderActiveTab = () => {
    const tabComponents = {
      dashboard: DashboardTab,
      cases: CasesTab,
      people: PeopleTab,
      organizations: OrganizationsTab,
      eligibility: EligibilityTab,
    };
    const TabComponent = tabComponents[activeTab];
    const props = tabProps[activeTab];
    if (TabComponent && props) {
      // Using React.createElement to avoid potential JSX parse edge in dynamic component
      return React.createElement(TabComponent, { ...props });
    }
    return React.createElement(
      'div',
      { className: 'p-4 text-center text-gray-400' },
      `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} component not loaded`,
    );
  };

  // React is imported via ESM; no global safety check needed

  return React.createElement(
    'div',
    { className: 'h-screen w-screen flex' },
    components.Sidebar &&
      React.createElement(components.Sidebar, {
        activeTab,
        onTabChange: setActiveTab,
        onSettingsClick: () => setIsSettingsOpen(true),
        caseViewMode,
        onCaseBackToList: () => {
          if (caseBackFunction) caseBackFunction();
        },
      }),
    React.createElement(
      'div',
      { className: 'flex-1 flex flex-col overflow-hidden' },
      components.Header &&
        React.createElement(components.Header, {
          fileStatus,
          autosaveStatus,
          onSettingsClick: () => setIsSettingsOpen(true),
          onManualSave: handleManualSave,
        }),
      React.createElement(
        'main',
        { className: 'flex-1 overflow-auto p-6 bg-gray-900' },
        renderActiveTab(),
      ),
    ),
    components.SettingsModal &&
      React.createElement(components.SettingsModal, {
        isOpen: isSettingsOpen,
        onClose: () => setIsSettingsOpen(false),
        fileService,
        onDataLoaded: handleDataLoaded,
        fileStatus,
        onFileStatusChange: setFileStatus,
      }),
  );
}

// Self-registration for both module and script loading
// Register with business registry (legacy global removal)
registerComponent('business', 'NightingaleCMSApp', NightingaleCMSApp);

export default NightingaleCMSApp;
