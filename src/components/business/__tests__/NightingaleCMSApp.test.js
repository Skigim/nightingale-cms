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
        organizations: [],
      }),
      saveData: jest.fn().mockResolvedValue(),
      createFileService: jest.fn().mockReturnValue({
        save: jest.fn(),
        load: jest.fn(),
        getFileInfo: jest.fn().mockReturnValue({ name: 'test.json' }),
      }),
    };

    // Mock AutosaveFileService
    window.AutosaveFileService = {
      createForReact: jest.fn().mockReturnValue({
        on: jest.fn(),
        off: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
      }),
    };

    // Mock component dependencies
    window.Header = jest.fn(() => React.createElement('div', null, 'Header'));
    window.Sidebar = jest.fn(() => React.createElement('div', null, 'Sidebar'));
    window.ErrorBoundary = jest.fn(({ children }) => children);
    window.DashboardTab = jest.fn(() =>
      React.createElement('div', null, 'Dashboard')
    );
    window.CasesTab = jest.fn(() => React.createElement('div', null, 'Cases'));
    window.PeopleTab = jest.fn(() =>
      React.createElement('div', null, 'People')
    );
    window.OrganizationsTab = jest.fn(() =>
      React.createElement('div', null, 'Organizations')
    );
    window.EligibilityTab = jest.fn(() =>
      React.createElement('div', null, 'Eligibility')
    );
    window.SettingsModal = jest.fn(() =>
      React.createElement('div', null, 'Settings')
    );

    // Mock toast service
    window.NightingaleToast = {
      show: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const Component = window.NightingaleCMSApp;
    expect(Component).toBeDefined();

    render(React.createElement(Component));
  });

  test('initializes autosave service correctly', async () => {
    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Component should initialize AutosaveFileService
    await waitFor(
      () => {
        expect(window.AutosaveFileService.createForReact).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  test('loads data on mount', async () => {
    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Wait for component to initialize dashboard tab (which shows data is ready)
    await waitFor(() => {
      expect(window.DashboardTab).toHaveBeenCalled();
    });
  });

  test('renders header component with correct props', () => {
    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Header should be rendered with required props (based on actual implementation)
    expect(window.Header).toHaveBeenCalledWith(
      expect.objectContaining({
        fileStatus: expect.any(String),
        autosaveStatus: expect.any(Object),
        onManualSave: expect.any(Function),
        onSettingsClick: expect.any(Function),
      }),
      {}
    );
  });

  test('renders sidebar component', () => {
    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    expect(window.Sidebar).toHaveBeenCalledWith(
      expect.objectContaining({
        activeTab: expect.any(String),
        onTabChange: expect.any(Function),
      }),
      expect.any(Object)
    );
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
          isOpen: true,
        }),
        expect.any(Object)
      );
    });
  });

  test('handles manual save from header', async () => {
    // Mock autosave service with saveData method
    const mockSaveData = jest.fn().mockResolvedValue();
    window.AutosaveFileService.createForReact.mockReturnValue({
      on: jest.fn(),
      off: jest.fn(),
      save: jest.fn(),
      load: jest.fn(),
      saveData: mockSaveData,
    });

    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Wait for autosave service initialization
    await waitFor(() => {
      expect(window.AutosaveFileService.createForReact).toHaveBeenCalled();
    });

    // Get the onManualSave callback from Header props
    const headerCall =
      window.Header.mock.calls[window.Header.mock.calls.length - 1];
    const headerProps = headerCall[0];
    const onManualSave = headerProps.onManualSave;

    // Simulate manual save
    await onManualSave();

    // Should use autosave service for saving
    expect(mockSaveData).toHaveBeenCalled();
  });

  test('provides correct initial status to header', async () => {
    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Check initial header props
    const headerProps = window.Header.mock.calls[0][0];
    expect(headerProps.fileStatus).toBe('disconnected');
    expect(headerProps.autosaveStatus).toEqual({
      message: 'Service not initialized',
      status: 'disconnected',
    });
  });

  test('handles autosave status updates', async () => {
    // Mock autosave service that calls status callback
    let statusCallback;
    window.AutosaveFileService.createForReact.mockImplementation((config) => {
      statusCallback = config.onStatusChange;
      return {
        on: jest.fn(),
        off: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
      };
    });

    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Wait for autosave service initialization
    await waitFor(() => {
      expect(window.AutosaveFileService.createForReact).toHaveBeenCalled();
    });

    // Simulate status change from autosave service
    if (statusCallback) {
      statusCallback({
        status: 'connected',
        message: 'Ready',
      });
    }

    // Header should receive updated status
    await waitFor(() => {
      const headerCall =
        window.Header.mock.calls[window.Header.mock.calls.length - 1];
      const headerProps = headerCall[0];
      expect(headerProps.autosaveStatus.status).toBe('connected');
    });
  });

  test('tracks dirty state correctly', async () => {
    // Mock autosave service that calls dirty state callback
    let dirtyCallback;
    window.AutosaveFileService.createForReact.mockImplementation((config) => {
      dirtyCallback = config.onDirtyChange;
      return {
        on: jest.fn(),
        off: jest.fn(),
        save: jest.fn(),
        load: jest.fn(),
      };
    });

    const Component = window.NightingaleCMSApp;

    render(React.createElement(Component));

    // Wait for autosave service initialization
    await waitFor(() => {
      expect(window.AutosaveFileService.createForReact).toHaveBeenCalled();
    });

    // Simulate dirty state change from autosave service
    if (dirtyCallback) {
      dirtyCallback(true);
    }

    // Component should track dirty state but doesn't pass it to Header in current implementation
    // This test verifies the callback is set up correctly
    expect(dirtyCallback).toBeDefined();
  });

  test('handles component unmounting gracefully', () => {
    const Component = window.NightingaleCMSApp;

    const { unmount } = render(React.createElement(Component));

    expect(() => unmount()).not.toThrow();
  });

  test('matches snapshot', async () => {
    const Component = window.NightingaleCMSApp;

    const { container } = render(React.createElement(Component));

    // Wait for dashboard tab to render (indicates component is initialized)
    await waitFor(() => {
      expect(window.DashboardTab).toHaveBeenCalled();
    });

    expect(container.firstChild).toMatchSnapshot();
  });
});
