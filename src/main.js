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
