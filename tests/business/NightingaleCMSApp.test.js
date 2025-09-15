/**
 * Minimal smoke tests for NightingaleCMSApp
 * Focuses on basic rendering without deep interactions
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock all the complex dependencies
jest.mock('../../src/services/registry', () => ({
  registerComponent: jest.fn(),
  getComponent: jest.fn((registry, name) => {
    // Return minimal mock components
    const mockComponents = {
      ui: {
        Sidebar: ({ children, ...props }) => (
          <div
            data-testid="sidebar"
            {...props}
          >
            {children}
          </div>
        ),
        Header: ({ children, ...props }) => (
          <div
            data-testid="header"
            {...props}
          >
            {children}
          </div>
        ),
      },
      business: {
        SettingsModal: ({ children, ...props }) => (
          <div
            data-testid="settings-modal"
            {...props}
          >
            {children}
          </div>
        ),
        BugReportModal: ({ children, ...props }) => (
          <div
            data-testid="bug-report-modal"
            {...props}
          >
            {children}
          </div>
        ),
      },
    };
    return mockComponents[registry]?.[name] || null;
  }),
}));

// Mock the tab components
jest.mock('../../src/components/business/DashboardTab.jsx', () => {
  return function DashboardTab(props) {
    return <div data-testid="dashboard-tab">Dashboard Tab</div>;
  };
});

jest.mock('../../src/components/business/CasesTab.jsx', () => {
  return function CasesTab(props) {
    return <div data-testid="cases-tab">Cases Tab</div>;
  };
});

jest.mock('../../src/components/business/PeopleTab.jsx', () => {
  return function PeopleTab(props) {
    return <div data-testid="people-tab">People Tab</div>;
  };
});

jest.mock('../../src/components/business/OrganizationsTab.jsx', () => {
  return function OrganizationsTab(props) {
    return <div data-testid="organizations-tab">Organizations Tab</div>;
  };
});

jest.mock('../../src/components/business/EligibilityTab.jsx', () => {
  return function EligibilityTab(props) {
    return <div data-testid="eligibility-tab">Eligibility Tab</div>;
  };
});

// Mock MUI components
jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }) => children,
  createTheme: jest.fn(() => ({})),
}));

jest.mock('@mui/material/CssBaseline', () => {
  return function CssBaseline() {
    return null;
  };
});

// Mock file service provider
jest.mock('../../src/services/fileServiceProvider.js', () => ({
  getFileService: jest.fn(() => null),
}));

// Mock toast service
jest.mock('../../src/services/nightingale.toast.js', () => ({
  showToast: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock globalThis
global.globalThis = global.globalThis || {};
global.globalThis.NightingaleLogger = {
  get: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
};

// Import the component after mocking
import NightingaleCMSApp from '../../src/components/business/NightingaleCMSApp.jsx';

describe('NightingaleCMSApp smoke tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test('renders without crashing', () => {
    render(<NightingaleCMSApp />);
  });

  test('renders main structural regions', () => {
    const { getByTestId } = render(<NightingaleCMSApp />);

    // Should render the main structural components
    expect(getByTestId('sidebar')).toBeInTheDocument();
    expect(getByTestId('header')).toBeInTheDocument();
  });

  test('renders active tab content', () => {
    const { getByTestId } = render(<NightingaleCMSApp />);

    // Default tab should be dashboard
    expect(getByTestId('dashboard-tab')).toBeInTheDocument();
  });

  test('renders modals in closed state', () => {
    const { getByTestId } = render(<NightingaleCMSApp />);

    // Modals should be present but closed
    expect(getByTestId('settings-modal')).toBeInTheDocument();
    expect(getByTestId('bug-report-modal')).toBeInTheDocument();
  });

  test('handles missing file service gracefully', () => {
    // File service returns null by default from mock
    expect(() => {
      render(<NightingaleCMSApp />);
    }).not.toThrow();
  });

  test('handles localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage not available');
    });

    expect(() => {
      render(<NightingaleCMSApp />);
    }).not.toThrow();
  });

  test('has proper container structure', () => {
    const { container } = render(<NightingaleCMSApp />);

    // Should have a main flex container
    const mainContainer = container.querySelector('.h-screen.w-screen.flex');
    expect(mainContainer).toBeInTheDocument();
  });

  test('renders main content area', () => {
    const { container } = render(<NightingaleCMSApp />);

    // Should have a main content area
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('flex-1', 'min-h-0', 'overflow-auto');
  });
});
