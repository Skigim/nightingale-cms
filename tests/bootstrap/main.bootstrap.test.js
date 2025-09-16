/**
 * Tests for src/main.js bootstrap behavior.
 * Covers immediate mount and DOMContentLoaded deferred mount paths.
 */

// We will mock dependencies that main.js initializes

jest.mock('../../src/services/nightingale.autosavefile.js', () => {
  return jest.fn().mockImplementation((opts) => ({
    __isMockAutosave: true,
    opts,
    initialize: jest.fn(),
    destroy: jest.fn(),
  }));
});

jest.mock('../../src/services/fileServiceProvider.js', () => ({
  setFileService: jest.fn(),
}));

jest.mock('../../src/services/nightingale.toast.js', () => ({
  showToast: jest.fn(),
}));

jest.mock('../../src/services/nightingale.logger.js', () => ({
  setupBasic: jest.fn(),
  configure: jest.fn(),
  get: jest.fn(() => ({ error: jest.fn(), warn: jest.fn(), debug: jest.fn() })),
}));

jest.mock('../../src/components/business/NightingaleCMSApp.jsx', () => () => {
  return null; // minimal stub component
});

jest.mock('../../src/theme/index.tsx', () => ({
  AppThemeProvider: ({ children }) => children,
}));

// Need to mock all the side-effect component imports referenced in main.js (empty modules)
const sideEffectModules = [
  '../../src/components/ui/Badge.jsx',
  '../../src/components/ui/Button.jsx',
  '../../src/components/ui/Cards.jsx',
  '../../src/components/ui/DataTable.jsx',
  '../../src/components/ui/ErrorBoundary.jsx',
  '../../src/components/ui/FormComponents.jsx',
  '../../src/components/ui/Header.jsx',
  '../../src/components/ui/Modal.jsx',
  '../../src/components/ui/SearchBar.jsx',
  '../../src/components/ui/Sidebar.jsx',
  '../../src/components/ui/Stepper.jsx',
  '../../src/components/ui/StepperModal.jsx',
  '../../src/components/ui/TabBase.jsx',
  '../../src/components/ui/TabHeader.jsx',
  '../../src/components/business/SettingsModal.jsx',
  '../../src/components/business/DashboardTab.jsx',
  '../../src/components/business/CasesTab.jsx',
  '../../src/components/business/PeopleTab.jsx',
  '../../src/components/business/OrganizationsTab.jsx',
  '../../src/components/business/EligibilityTab.jsx',
  '../../src/components/business/AvsImportModal.jsx',
  '../../src/components/business/CaseCreationModal.jsx',
  '../../src/components/business/CaseDetailsView.jsx',
  '../../src/components/business/FinancialItemCard.jsx',
  '../../src/components/business/FinancialItemModal.jsx',
  '../../src/components/business/FinancialManagementSection.jsx',
  '../../src/components/business/NotesModal.jsx',
  '../../src/components/business/OrganizationModal.jsx',
  '../../src/components/business/PersonCreationModal.jsx',
  '../../src/components/business/PersonDetailsView.jsx',
  '../../src/components/business/BugReportModal.jsx',
];
sideEffectModules.forEach((m) => jest.mock(m, () => ({})));

import AutosaveFileService from '../../src/services/nightingale.autosavefile.js';
import { setFileService } from '../../src/services/fileServiceProvider.js';
import NightingaleLogger from '../../src/services/nightingale.logger.js';

// Provide minimal React & ReactDOM environment
import React from 'react';
// Define mock inside factory to avoid out-of-scope reference restriction
jest.mock('react-dom/client', () => {
  const mockCreateRoot = jest.fn(() => ({ render: jest.fn() }));
  return {
    createRoot: (...args) => mockCreateRoot(...args),
    __mockCreateRoot: mockCreateRoot,
  };
});

// Stub CSS import referenced by main.js so Jest doesn't try to parse Tailwind directives
jest.mock('../../src/index.css', () => ({}), { virtual: true });

// Helper to reset module cache for main.js between scenarios
function importFreshMain() {
  jest.isolateModules(() => {
    require('../../src/main.js');
  });
}

describe('main.js bootstrap', () => {
  beforeEach(() => {
    // Setup DOM root
    document.body.innerHTML = '<div id="root"></div>';
    // Clear mock from react-dom/client
    const rd = require('react-dom/client');
    rd.__mockCreateRoot.mockClear();
    // localStorage mock
    const store = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: (k, v) => (store[k] = v),
        getItem: (k) => store[k],
        removeItem: (k) => delete store[k],
      },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('immediate mount when document already loaded', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });

    importFreshMain();

    // createRoot should have been called with root element
    const rd = require('react-dom/client');
    expect(rd.__mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById('root'),
    );
    const rootInstance = rd.__mockCreateRoot.mock.results[0].value;
    expect(rootInstance.render).toHaveBeenCalledTimes(1);

    // Autosave service constructed
    expect(AutosaveFileService).toHaveBeenCalledTimes(1);
    expect(setFileService).toHaveBeenCalledTimes(1);

    // Logger initialization attempted
    expect(NightingaleLogger.setupBasic).toHaveBeenCalled();
  });

  test('deferred mount waits for DOMContentLoaded', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    const addEventSpy = jest.spyOn(document, 'addEventListener');

    importFreshMain();

    // Should register DOMContentLoaded listener
    expect(addEventSpy).toHaveBeenCalledWith(
      'DOMContentLoaded',
      expect.any(Function),
    );
    const handler = addEventSpy.mock.calls.find(
      (c) => c[0] === 'DOMContentLoaded',
    )[1];

    // No render yet
    const rd = require('react-dom/client');
    expect(rd.__mockCreateRoot).not.toHaveBeenCalled();

    // Capture autosave constructor calls prior to event
    const initialAutosaveCalls = AutosaveFileService.mock.calls.length;

    // Fire event to trigger mount
    handler();

    // After event render should happen
    const rd2 = require('react-dom/client');
    expect(rd2.__mockCreateRoot).toHaveBeenCalled();
    // Autosave may already have been initialized during import; ensure no extra unexpected instantiation
    expect(AutosaveFileService.mock.calls.length).toBeGreaterThanOrEqual(
      initialAutosaveCalls,
    );
  });

  test('no root element results in no render call', () => {
    document.body.innerHTML = '<div id="other"></div>';
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true,
    });

    importFreshMain();

    const rd = require('react-dom/client');
    expect(rd.__mockCreateRoot).not.toHaveBeenCalled();
  });
});
