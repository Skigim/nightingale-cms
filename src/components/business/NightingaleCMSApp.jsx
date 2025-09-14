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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  // TODO: Implement people and organizations navigation in sidebar
  // const [peopleViewMode, setPeopleViewMode] = useState('list'); // Track if we're in person details view
  // const [peopleBackFunction, setPeopleBackFunction] = useState(null); // Function to go back from person details
  // const [organizationsViewMode, setOrganizationsViewMode] = useState('list'); // Track if we're in organization details view
  // const [organizationsBackFunction, setOrganizationsBackFunction] = useState(null); // Function to go back from organization details

  // File service instance (hydrated from provider)
  const [fileService, setFileServiceState] = useState(() => getFileService());
  const [autosaveStatus, setAutosaveStatus] = useState(null);

  // Keep AutosaveFileService synced with current data and status callback
  useEffect(() => {
    if (!fileService) return;
    try {
      if (typeof fileService.initializeWithReactState === 'function') {
        fileService.initializeWithReactState(
          () => fullDataRef.current,
          (status) => {
            setAutosaveStatus(status);
            if (status?.status === 'waiting') {
              setFileStatus('reconnect');
            }
          },
        );
      } else if (typeof fileService.setDataProvider === 'function') {
        // Fallback: at least ensure provider is set
        fileService.setDataProvider(() => fullDataRef.current);
      }
    } catch (_) {
      // no-op; UI will show disconnected
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileService]);

  // Use ref for live data access to avoid stale closure issues
  const fullDataRef = useRef(null);

  // Opt-in navigation logging via localStorage flag
  const navLogsEnabled = useMemo(() => {
    try {
      const v = localStorage.getItem('nightingale:navLogs');
      return v === '1' || v === 'true' || v === 'on';
    } catch (_) {
      return false;
    }
  }, []);

  // Data update handler - must be defined before useMemo that uses it
  const handleDataUpdate = useCallback(
    (newData) => {
      setFullData(newData);
      // Notify autosave service debounced save may proceed
      try {
        fileService?.notifyDataChange?.();
      } catch (_) {
        /* ignore */
      }
    },
    [fileService],
  );

  // Keep ref synchronized with state
  useEffect(() => {
    fullDataRef.current = fullData;
  }, [fullData]);

  const handleTabChange = useCallback(
    (nextTab) => {
      if (navLogsEnabled) {
        try {
          const logger = globalThis.NightingaleLogger?.get('nav:tab_change');
          logger?.info('Tab changed', { from: activeTab, to: nextTab });
        } catch (_) {
          /* ignore */
        }
      }
      setActiveTab(nextTab);
    },
    [navLogsEnabled, activeTab],
  );

  const handleCaseViewModeChange = useCallback(
    (nextMode) => {
      if (navLogsEnabled) {
        try {
          const logger = globalThis.NightingaleLogger?.get('nav:cases');
          logger?.info('Case view mode changed', {
            from: caseViewMode,
            to: nextMode,
          });
        } catch (_) {
          /* ignore */
        }
      }
      setCaseViewMode(nextMode);
    },
    [navLogsEnabled, caseViewMode],
  );

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

  // When fileService changes, reflect connection status and auto-load data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fileService?.checkPermission) return;
      try {
        const perm = await fileService.checkPermission();
        if (cancelled) return;
        if (perm === 'granted') {
          setFileStatus('connected');
          if (typeof fileService.readFile === 'function') {
            const data = await fileService.readFile();
            if (cancelled) return;
            if (data && Object.keys(data).length > 0) {
              setFullData(data);
            }
          }
        } else {
          setFileStatus('reconnect');
        }
      } catch (_) {
        setFileStatus('disconnected');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileService]);

  // Memoize non-tab components (tabs imported directly above)
  const components = useMemo(
    () => ({
      Sidebar: getComponent('ui', 'Sidebar'),
      Header: getComponent('ui', 'Header'),
      SettingsModal: getComponent('business', 'SettingsModal'),
      BugReportModal: getComponent('business', 'BugReportModal'),
    }),
    [],
  );

  // Memoize tab props to prevent unnecessary re-renders of heavy tab components
  const tabProps = useMemo(
    () => ({
      dashboard: { fullData, onUpdateData: handleDataUpdate },
      cases: {
        fullData,
        onUpdateData: handleDataUpdate,
        fileService,
        onViewModeChange: handleCaseViewModeChange,
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
      handleCaseViewModeChange,
      setCaseBackFunction,
    ],
  );

  // Memoize service status to optimize conditional rendering
  const serviceStatus = useMemo(
    () => ({
      isReady: !!fileService,
      hasAutosave: !!fileService, // unified service now
      canSave: !!fileService?.save,
      isLoading: false,
    }),
    [fileService],
  );

  // Toast function - module based
  const showToast = (msg, type) => Toast.showToast?.(msg, type);

  const handleSubmitBug = useCallback(
    async ({ content, activeTab: tab, createdAt, diagnostics }) => {
      try {
        let recentLogs = null;
        try {
          const exported = globalThis.NightingaleLogger?.exportLogs?.('json');
          // exportLogs('json') returns a JSON string; attempt parse to embed as object
          if (exported && typeof exported === 'string') {
            try {
              recentLogs = JSON.parse(exported);
            } catch (_e) {
              recentLogs = exported; // fall back to raw string
            }
          } else if (exported) {
            recentLogs = exported;
          }
        } catch (_) {
          // ignore log export errors
        }
        const logger = globalThis.NightingaleLogger?.get('bug-report');
        logger?.info('Bug report submitted', {
          tab,
          createdAt,
          content,
          diagnostics,
        });
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tab,
          content,
          createdAt,
          ...(diagnostics
            ? { diagnostics: { ...diagnostics, logs: recentLogs } }
            : recentLogs
              ? { diagnostics: { logs: recentLogs } }
              : {}),
        };
        // Persist to localStorage list first (source of truth for aggregation)
        const key = 'nightingale-bug-reports';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push(entry);
        localStorage.setItem(key, JSON.stringify(list));

        // Attempt to mirror to project folder as JSON array
        if (fileService?.writeNamedFile) {
          const fileName = 'bug-reports.json';
          await fileService.writeNamedFile(fileName, list);
          showToast('Bug report saved to project folder', 'success');
        } else {
          showToast('Bug report stored locally (no file access)', 'warning');
        }
      } catch (err) {
        const logger = globalThis.NightingaleLogger?.get('bug-report');
        logger?.error('Failed to submit bug report', { error: err.message });
        showToast('Failed to save bug report', 'error');
      } finally {
        setIsBugModalOpen(false);
      }
    },
    [fileService],
  );

  // (Legacy services ready listener removed) Autosave/file service will now be
  // initialized elsewhere; component renders immediately.

  // Handle manual save
  const handleManualSave = async () => {
    if (serviceStatus.canSave) {
      try {
        await fileService.save();
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
  const handleDataLoaded = useCallback(
    (data) => {
      setFullData(data);
      try {
        fileService?.notifyDataChange?.();
      } catch (_) {
        /* ignore */
      }
    },
    [fileService],
  );

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

  // Global MUI dark theme aligned with Tailwind colors used in the app
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: { main: '#3B82F6' }, // blue-500
          secondary: { main: '#6366F1' }, // indigo-500
          background: {
            default: '#111827', // gray-900 (matches app main background)
            paper: '#1F2937', // gray-800
          },
          text: {
            primary: '#E5E7EB', // gray-200
            secondary: '#9CA3AF', // gray-400
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              // Theme the scrollbars for the main app content area only
              'main.flex-1': {
                scrollbarWidth: 'thin',
                scrollbarColor: '#4B5563 #111827', // thumb track (Firefox)
              },
              'main.flex-1::-webkit-scrollbar': {
                width: '10px',
                height: '10px',
              },
              'main.flex-1::-webkit-scrollbar-track': {
                background: '#111827', // gray-900
                borderRadius: 8,
              },
              'main.flex-1::-webkit-scrollbar-thumb': {
                backgroundColor: '#4B5563', // gray-600
                borderRadius: 8,
                border: '2px solid #111827',
              },
              'main.flex-1::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#6B7280', // gray-500
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', borderRadius: 8 },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: { backgroundImage: 'none' },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: { fontWeight: 600 },
            },
          },
          MuiDataGrid: {
            styleOverrides: {
              root: {
                // Avoid customizing native scrollbars inside the DataGrid virtual scroller
                // to prevent a duplicate (native) scrollbar from appearing alongside
                // MUI X's overlay scrollbar implementation.
              },
            },
          },
        },
      }),
    [],
  );

  return React.createElement(
    ThemeProvider,
    { theme },
    React.createElement(CssBaseline, null),
    React.createElement(
      'div',
      { className: 'h-screen w-screen flex' },
      components.Sidebar &&
        React.createElement(components.Sidebar, {
          activeTab,
          onTabChange: handleTabChange,
          onSettingsClick: () => setIsSettingsOpen(true),
          onReportBugClick: () => setIsBugModalOpen(true),
          caseViewMode,
          onCaseBackToList: () => {
            if (navLogsEnabled) {
              try {
                const logger = globalThis.NightingaleLogger?.get('nav:cases');
                logger?.info('Back to cases list');
              } catch (_) {
                /* ignore */
              }
            }
            if (caseBackFunction) caseBackFunction();
          },
        }),
      React.createElement(
        'div',
        { className: 'flex-1 flex flex-col overflow-hidden min-h-0 min-w-0' },
        components.Header &&
          React.createElement(components.Header, {
            fileStatus,
            autosaveStatus,
            onSettingsClick: async () => {
              // If we are in reconnect state, try to request permission via user gesture first
              if (fileStatus === 'reconnect' && fileService?.ensurePermission) {
                const granted = await fileService.ensurePermission();
                if (granted) {
                  setFileStatus('connected');
                  // Attempt to read data after reconnect
                  try {
                    const data = await fileService.readFile?.();
                    if (data && Object.keys(data).length > 0) {
                      setFullData(data);
                    }
                  } catch (_) {
                    /* ignore */
                  }
                  return; // No need to open settings if permission granted
                }
              }
              setIsSettingsOpen(true);
            },
            onManualSave: handleManualSave,
          }),
        React.createElement(
          'main',
          { className: 'flex-1 min-h-0 overflow-auto p-6 bg-gray-900' },
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
      components.BugReportModal &&
        React.createElement(components.BugReportModal, {
          isOpen: isBugModalOpen,
          onClose: () => setIsBugModalOpen(false),
          onSubmit: handleSubmitBug,
          activeTab,
          includeDiagnostics: true,
          diagnostics: {
            appVersion: '1.0.0-rc.1',
            git: undefined,
            locale: globalThis?.navigator?.language || 'unknown',
            storage: {
              localStorage: !!globalThis.localStorage,
            },
          },
        }),
    ),
  );
}

// Self-registration for both module and script loading
// Register with business registry (legacy global removal)
registerComponent('business', 'NightingaleCMSApp', NightingaleCMSApp);

export default NightingaleCMSApp;
