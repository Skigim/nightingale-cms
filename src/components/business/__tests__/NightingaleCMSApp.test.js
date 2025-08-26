/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Import the component
require('../NightingaleCMSApp.js');

describe('NightingaleCMSApp Component', () => {
  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;
    
    // Mock required services and components
    window.NightingaleServices = {
      loadData: jest.fn().mockResolvedValue({
        cases: [],
        people: [],
        organizations: []
      }),
      saveData: jest.fn().mockResolvedValue(),
      createFileService: jest.fn().mockReturnValue({
        save: jest.fn(),
        load: jest.fn(),
        getFileInfo: jest.fn().mockReturnValue({ name: 'test.json' })
      })
    };
    
    // Mock AutosaveFileService
    window.AutosaveFileService = {
      createForReact: jest.fn().mockReturnValue({
        on: jest.fn(),
        off: jest.fn(),
        save: jest.fn(),
        load: jest.fn()
      })
    };
    
    // Mock component dependencies
    window.Header = jest.fn(() => React.createElement('div', null, 'Header'));
    window.Sidebar = jest.fn(() => React.createElement('div', null, 'Sidebar'));
    window.ErrorBoundary = jest.fn(({ children }) => children);
    window.DashboardTab = jest.fn(() => React.createElement('div', null, 'Dashboard'));
    window.CasesTab = jest.fn(() => React.createElement('div', null, 'Cases'));
    window.PeopleTab = jest.fn(() => React.createElement('div', null, 'People'));
    window.OrganizationsTab = jest.fn(() => React.createElement('div', null, 'Organizations'));
    window.EligibilityTab = jest.fn(() => React.createElement('div', null, 'Eligibility'));
    window.SettingsModal = jest.fn(() => React.createElement('div', null, 'Settings'));
    
    // Mock toast service
    window.NightingaleToast = {
      show: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const Component = window.NightingaleCMSApp;
    expect(Component).toBeDefined();
    
    render(React.createElement(Component));
  });

  test('initializes with dashboard tab active', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    await waitFor(() => {
      expect(window.DashboardTab).toHaveBeenCalled();
    });
  });

  test('loads data on mount', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    await waitFor(() => {
      expect(window.NightingaleServices.loadData).toHaveBeenCalled();
    });
  });

  test('renders header component', () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    expect(window.Header).toHaveBeenCalledWith(
      expect.objectContaining({
        fileStatus: expect.any(String),
        isDirty: expect.any(Boolean),
        autosaveStatus: expect.any(Object)
      }),
      expect.any(Object)
    );
  });

  test('renders sidebar component', () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    expect(window.Sidebar).toHaveBeenCalledWith(
      expect.objectContaining({
        activeTab: expect.any(String),
        onTabChange: expect.any(Function)
      }),
      expect.any(Object)
    );
  });

  test('wraps content in ErrorBoundary', () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    expect(window.ErrorBoundary).toHaveBeenCalled();
  });

  test('changes active tab when sidebar tab is clicked', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    // Get the onTabChange callback from Sidebar props
    const sidebarProps = window.Sidebar.mock.calls[0][0];
    const onTabChange = sidebarProps.onTabChange;
    
    // Simulate tab change
    onTabChange('cases');

    await waitFor(() => {
      expect(window.CasesTab).toHaveBeenCalled();
    });
  });

  test('opens settings modal when header settings is clicked', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    // Get the onSettingsClick callback from Header props
    const headerProps = window.Header.mock.calls[0][0];
    const onSettingsClick = headerProps.onSettingsClick;
    
    // Simulate settings click
    onSettingsClick();

    await waitFor(() => {
      expect(window.SettingsModal).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true
        }),
        expect.any(Object)
      );
    });
  });

  test('handles manual save from header', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    // Get the onManualSave callback from Header props
    const headerProps = window.Header.mock.calls[0][0];
    const onManualSave = headerProps.onManualSave;
    
    // Simulate manual save
    onManualSave();

    await waitFor(() => {
      expect(window.NightingaleServices.saveData).toHaveBeenCalled();
    });
  });

  test('updates file status correctly', async () => {
    window.NightingaleServices.loadData.mockResolvedValue({
      cases: [],
      people: [],
      organizations: []
    });

    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    await waitFor(() => {
      const headerProps = window.Header.mock.calls[window.Header.mock.calls.length - 1][0];
      expect(headerProps.fileStatus).toBe('connected');
    });
  });

  test('handles data loading errors', async () => {
    window.NightingaleServices.loadData.mockRejectedValue(new Error('Load failed'));

    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    await waitFor(() => {
      const headerProps = window.Header.mock.calls[window.Header.mock.calls.length - 1][0];
      expect(headerProps.fileStatus).toBe('error');
    });
  });

  test('tracks dirty state correctly', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    // Wait for initial load
    await waitFor(() => {
      expect(window.NightingaleServices.loadData).toHaveBeenCalled();
    });

    // Initial state should not be dirty
    const initialHeaderProps = window.Header.mock.calls[window.Header.mock.calls.length - 1][0];
    expect(initialHeaderProps.isDirty).toBe(false);
  });

  test('initializes autosave service', async () => {
    const Component = window.NightingaleCMSApp;
    
    render(React.createElement(Component));

    await waitFor(() => {
      expect(window.NightingaleServices.createFileService).toHaveBeenCalled();
    });
  });

  test('handles component unmounting gracefully', () => {
    const Component = window.NightingaleCMSApp;
    
    const { unmount } = render(React.createElement(Component));
    
    expect(() => unmount()).not.toThrow();
  });

  test('matches snapshot', async () => {
    const Component = window.NightingaleCMSApp;
    
    const { container } = render(React.createElement(Component));

    // Wait for initial load to complete
    await waitFor(() => {
      expect(window.NightingaleServices.loadData).toHaveBeenCalled();
    });

    expect(container.firstChild).toMatchSnapshot();
  });
});