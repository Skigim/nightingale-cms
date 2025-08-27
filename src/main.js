/**
 * Nightingale CMS - Main Module Entry Point
 *
 * ES6 Module version of the Nightingale CMS application.
 * Replaces the script-tag based loading system with proper module imports.
 *
 * @version 2.0.0
 * @author Nightingale CMS Team
 */

// ========================================================================
// CORE DEPENDENCIES - External Libraries
// ========================================================================

// React and ReactDOM are loaded via CDN in index.html
// Tailwind CSS is loaded via CDN in index.html
// Day.js is loaded via asset in index.html

// ========================================================================
// NIGHTINGALE SERVICES - Dependency Order Matters!
// ========================================================================

// Phase 1: Core Services (no dependencies)
import NightingaleCoreUtilities from './services/core.js';
import DayJSService from './services/nightingale.dayjs.js';
import ParsersService from './services/nightingale.parsers.js';

// Phase 2: Data Services (depend on core)
import AutosaveFileService from './services/nightingale.autosavefile.js';
import SearchService from './services/nightingale.search.js';
import DataManagementService from './services/nightingale.datamanagement.js';

// Phase 3: UI Services (depend on core + data)
import ToastService from './services/nightingale.toast.js';
import ClipboardService from './services/nightingale.clipboard.js';
import UIUtilities from './services/ui.js';

// Phase 4: Business Services (depend on all above)
import CMSUtilities from './services/cms.js';
import PlaceholdersService from './services/nightingale.placeholders.js';
import TemplatesService from './services/nightingale.templates.js';
import DocumentGenerationService from './services/nightingale.documentgeneration.js';

// ========================================================================
// NIGHTINGALE COMPONENTS - Layered Architecture
// ========================================================================

// UI Layer: Generic components (framework-agnostic)
import {
  Button,
  PrimaryButton,
  SecondaryButton,
} from './components/ui/Button.js';
import Badge from './components/ui/Badge.js';
import Cards from './components/ui/Cards.js';
import DataTable from './components/ui/DataTable.js';
import ErrorBoundary from './components/ui/ErrorBoundary.js';
import FormComponents from './components/ui/FormComponents.js';
import Header from './components/ui/Header.js';
import Modal from './components/ui/Modal.js';
import SearchBar from './components/ui/SearchBar.js';
import Sidebar from './components/ui/Sidebar.js';
import Stepper from './components/ui/Stepper.js';
import StepperModal from './components/ui/StepperModal.js';
import TabBase from './components/ui/TabBase.js';
import TabHeader from './components/ui/TabHeader.js';

// Business Layer: Domain-specific components
import AvsImportModal from './components/business/AvsImportModal.js';
import CaseCreationModal from './components/business/CaseCreationModal.js';
import CaseDetailsView from './components/business/CaseDetailsView.js';
import CasesTab from './components/business/CasesTab.js';
import DashboardTab from './components/business/DashboardTab.js';
import EligibilityTab from './components/business/EligibilityTab.js';
import FinancialItemCard from './components/business/FinancialItemCard.js';
import FinancialItemModal from './components/business/FinancialItemModal.js';
import FinancialManagementSection from './components/business/FinancialManagementSection.js';
import NightingaleCMSApp from './components/business/NightingaleCMSApp.js';
import NotesModal from './components/business/NotesModal.js';
import OrganizationModal from './components/business/OrganizationModal.js';
import OrganizationsTab from './components/business/OrganizationsTab.js';
import PeopleTab from './components/business/PeopleTab.js';
import PersonCreationModal from './components/business/PersonCreationModal.js';
import SettingsModal from './components/business/SettingsModal.js';

// ========================================================================
// SERVICE REGISTRATION & GLOBAL SETUP
// ========================================================================

/**
 * Register all services globally for backward compatibility
 * This maintains the existing API while using ES6 modules internally
 */
function registerServices() {
  // Core Services
  window.NightingaleCoreUtilities = NightingaleCoreUtilities;
  window.NightingaleDayJS = DayJSService;
  window.NightingaleParsers = ParsersService;

  // Data Services
  window.AutosaveFileService = AutosaveFileService;
  window.NightingaleSearch = SearchService;
  window.NightingaleDataManagement = DataManagementService;

  // UI Services
  window.NightingaleToast = ToastService;
  window.NightingaleClipboard = ClipboardService;
  window.NightingaleUIUtilities = UIUtilities;

  // Business Services
  window.NightingaleCMSUtilities = CMSUtilities;
  window.NightingalePlaceholders = PlaceholdersService;
  window.NightingaleTemplates = TemplatesService;
  window.NightingaleDocumentGeneration = DocumentGenerationService;

  // Legacy global function aliases (for existing code compatibility)
  window.sanitize = NightingaleCoreUtilities.sanitize;
  window.showToast = ToastService.show;
  window.openVRApp = CMSUtilities.openVRApp;

  console.log('✅ All Nightingale Services registered globally');
}

/**
 * Register all components globally for backward compatibility
 */
function registerComponents() {
  // UI Components
  window.Button = Button;
  window.PrimaryButton = PrimaryButton;
  window.SecondaryButton = SecondaryButton;
  window.Badge = Badge;
  window.Cards = Cards;
  window.DataTable = DataTable;
  window.ErrorBoundary = ErrorBoundary;
  window.FormComponents = FormComponents;
  window.Header = Header;
  window.Modal = Modal;
  window.SearchBar = SearchBar;
  window.Sidebar = Sidebar;
  window.Stepper = Stepper;
  window.StepperModal = StepperModal;
  window.TabBase = TabBase;
  window.TabHeader = TabHeader;

  // Business Components
  window.AvsImportModal = AvsImportModal;
  window.CaseCreationModal = CaseCreationModal;
  window.CaseDetailsView = CaseDetailsView;
  window.CasesTab = CasesTab;
  window.DashboardTab = DashboardTab;
  window.EligibilityTab = EligibilityTab;
  window.FinancialItemCard = FinancialItemCard;
  window.FinancialItemModal = FinancialItemModal;
  window.FinancialManagementSection = FinancialManagementSection;
  window.NightingaleCMSApp = NightingaleCMSApp;
  window.NotesModal = NotesModal;
  window.OrganizationModal = OrganizationModal;
  window.OrganizationsTab = OrganizationsTab;
  window.PeopleTab = PeopleTab;
  window.PersonCreationModal = PersonCreationModal;
  window.SettingsModal = SettingsModal;

  console.log('✅ All Nightingale Components registered globally');
}

/**
 * Initialize the Nightingale CMS Application
 */
function initializeNightingaleCMS() {
  console.log('🚀 Nightingale CMS - Initializing ES6 Module System...');

  // Register services and components
  registerServices();
  registerComponents();

  // Initialize the main React app
  const root = window.ReactDOM.createRoot(document.getElementById('root'));
  root.render(window.React.createElement(NightingaleCMSApp));

  // Dispatch ready events for compatibility
  window.dispatchEvent(
    new CustomEvent('nightingale:services:ready', {
      detail: { timestamp: Date.now(), moduleSystem: 'ES6' },
    })
  );

  window.dispatchEvent(
    new CustomEvent('nightingale:components:ready', {
      detail: { timestamp: Date.now(), moduleSystem: 'ES6' },
    })
  );

  window.dispatchEvent(
    new CustomEvent('nightingale:ready', {
      detail: { timestamp: Date.now(), moduleSystem: 'ES6' },
    })
  );

  console.log('🎉 Nightingale CMS - Fully Initialized with ES6 Modules!');
}

// ========================================================================
// BOOTSTRAP THE APPLICATION
// ========================================================================

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNightingaleCMS);
} else {
  // DOM already loaded
  initializeNightingaleCMS();
}

// Export the main app for potential use by other modules
export default NightingaleCMSApp;
export {
  // Services
  NightingaleCoreUtilities,
  AutosaveFileService,
  ToastService,
  CMSUtilities,

  // Components
  Button,
  Modal,
  DataTable,
  NightingaleCMSApp,
};
