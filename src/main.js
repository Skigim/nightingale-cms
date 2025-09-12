import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// --- Preload UI Components (side-effect imports for registry registration) ---
import './components/ui/Badge.jsx';
import './components/ui/Button.jsx';
import './components/ui/Cards.jsx';
import './components/ui/DataTable.jsx';
import './components/ui/ErrorBoundary.jsx';
import './components/ui/FormComponents.jsx';
import './components/ui/Header.jsx';
import './components/ui/Modal.jsx';
import './components/ui/SearchBar.jsx';
import './components/ui/Sidebar.jsx';
import './components/ui/Stepper.jsx';
import './components/ui/StepperModal.jsx';
import './components/ui/TabBase.jsx';
import './components/ui/TabHeader.jsx';

// --- Preload Business Components (tabs, modals, detail views) ---
import './components/business/SettingsModal.jsx';
import './components/business/DashboardTab.jsx';
import './components/business/CasesTab.jsx';
import './components/business/PeopleTab.jsx';
import './components/business/OrganizationsTab.jsx';
import './components/business/EligibilityTab.jsx';
import './components/business/AvsImportModal.jsx';
import './components/business/CaseCreationModal.jsx';
import './components/business/CaseDetailsView.jsx';
import './components/business/FinancialItemCard.jsx';
import './components/business/FinancialItemModal.jsx';
import './components/business/FinancialManagementSection.jsx';
import './components/business/NotesModal.jsx';
import './components/business/OrganizationModal.jsx';
import './components/business/PersonCreationModal.jsx';
import './components/business/PersonDetailsView.jsx';
import './components/business/BugReportModal.jsx';

// Import the root app last so all dependencies are registered
import NightingaleCMSApp from './components/business/NightingaleCMSApp.jsx';
import AutosaveFileService from './services/nightingale.autosavefile.js';
import { setFileService } from './services/fileServiceProvider.js';
import Toast from './services/nightingale.toast.js';
import NightingaleLogger from './services/nightingale.logger.js';

// Initialize core providers/services before mount
function initializeProviders() {
  try {
    // Initialize structured logger early (console + memory transports)
    try {
      // Enable memory transport for logger
      NightingaleLogger.setupBasic(true);
      if (!globalThis.NightingaleLogger) {
        Object.defineProperty(globalThis, 'NightingaleLogger', {
          value: NightingaleLogger,
          writable: false,
          configurable: true,
        });
      }
    } catch (e) {
      // Swallow logger init errors; app should continue
    }

    // Create autosave-enabled file service instance
    const fileService = new AutosaveFileService({
      errorCallback: (msg, type = 'error') => Toast.showToast?.(msg, type),
    });
    // Provide to services via provider
    setFileService(fileService);

    // Optionally expose to legacy globals (read-only) for diagnostics
    if (!globalThis.fileService) {
      Object.defineProperty(globalThis, 'fileService', {
        value: fileService,
        writable: false,
        configurable: true,
      });
    }
  } catch (e) {
    console.error('Failed to initialize file service', e);
  }
}

// Minimal bootstrap: render app directly (React already on window via CDN)
const mount = () => {
  initializeProviders();
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(NightingaleCMSApp),
    ),
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

export default NightingaleCMSApp;
