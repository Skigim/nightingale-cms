import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// --- Preload UI Components (side-effect imports for registry registration) ---
import './components/ui/Badge.js';
import './components/ui/Button.js';
import './components/ui/Cards.js';
import './components/ui/DataTable.js';
import './components/ui/ErrorBoundary.js';
import './components/ui/FormComponents.js';
import './components/ui/Header.js';
import './components/ui/Modal.js';
import './components/ui/SearchBar.js';
import './components/ui/Sidebar.js';
import './components/ui/Stepper.js';
import './components/ui/StepperModal.js';
import './components/ui/TabBase.js';
import './components/ui/TabHeader.js';

// --- Preload Business Components (tabs, modals, detail views) ---
import './components/business/SettingsModal.js';
import './components/business/DashboardTab.js';
import './components/business/CasesTab.js';
import './components/business/PeopleTab.jsx';
import './components/business/OrganizationsTab.js';
import './components/business/EligibilityTab.js';
import './components/business/AvsImportModal.js';
import './components/business/CaseCreationModal.js';
import './components/business/CaseDetailsView.js';
import './components/business/FinancialItemCard.js';
import './components/business/FinancialItemModal.js';
import './components/business/FinancialManagementSection.js';
import './components/business/NotesModal.js';
import './components/business/OrganizationModal.js';
import './components/business/PersonCreationModal.js';
import './components/business/PersonDetailsView.js';

// Import the root app last so all dependencies are registered
import NightingaleCMSApp from './components/business/NightingaleCMSApp.js';

// Minimal bootstrap: render app directly (React already on window via CDN)
const mount = () => {
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
