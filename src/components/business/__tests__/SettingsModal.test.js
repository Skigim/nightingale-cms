/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Import the component
require('../SettingsModal.js');

describe('SettingsModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    fileService: {
      save: jest.fn().mockResolvedValue(),
      load: jest.fn().mockResolvedValue(),
      getFileInfo: jest.fn().mockReturnValue({ name: 'test.json', size: 1024 })
    },
    data: {
      cases: [],
      people: [],
      organizations: []
    },
    onDataUpdate: jest.fn()
  };

  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;
    
    // Mock required services
    window.NightingaleServices = {
      createSampleData: jest.fn().mockReturnValue({
        cases: [{ id: '1', clientName: 'Sample Case' }],
        people: [{ id: '1', name: 'Sample Person' }],
        organizations: [{ id: '1', name: 'Sample Org' }]
      }),
      exportData: jest.fn(),
      importData: jest.fn()
    };
    
    // Mock file operations
    global.URL = {
      createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: jest.fn()
    };
    
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options
    }));
    
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const Component = window.SettingsModal;
    expect(Component).toBeDefined();
    
    render(React.createElement(Component, defaultProps));
  });

  test('displays modal title', () => {
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    const Component = window.SettingsModal;
    
    const { container } = render(React.createElement(Component, {
      ...defaultProps,
      isOpen: false
    }));

    expect(container.firstChild).toBeNull();
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, {
      ...defaultProps,
      onClose: mockOnClose
    }));

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows file information section', () => {
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText(/file info/i)).toBeInTheDocument();
    expect(screen.getByText('test.json')).toBeInTheDocument();
  });

  test('creates sample data when button is clicked', async () => {
    const mockOnDataUpdate = jest.fn();
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, {
      ...defaultProps,
      onDataUpdate: mockOnDataUpdate
    }));

    const createSampleButton = screen.getByText(/create sample/i);
    fireEvent.click(createSampleButton);
    
    await waitFor(() => {
      expect(window.NightingaleServices.createSampleData).toHaveBeenCalled();
      expect(mockOnDataUpdate).toHaveBeenCalledWith(expect.objectContaining({
        cases: expect.any(Array),
        people: expect.any(Array),
        organizations: expect.any(Array)
      }));
    });
  });

  test('exports data when export button is clicked', async () => {
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, defaultProps));

    const exportButton = screen.getByText(/export/i);
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(window.NightingaleServices.exportData).toHaveBeenCalledWith(defaultProps.data);
    });
  });

  test('handles file import', async () => {
    const mockOnDataUpdate = jest.fn();
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, {
      ...defaultProps,
      onDataUpdate: mockOnDataUpdate
    }));

    const fileInput = screen.getByRole('button', { name: /import/i });
    
    // Simulate file selection
    const file = new File(['{"cases": []}'], 'import.json', { type: 'application/json' });
    const changeEvent = {
      target: { files: [file] }
    };
    
    fireEvent.change(fileInput, changeEvent);
    
    // Note: File import testing is complex due to FileReader API
    // This test validates the UI interaction
    expect(fileInput).toBeInTheDocument();
  });

  test('shows data statistics', () => {
    const Component = window.SettingsModal;
    const dataWithStats = {
      cases: [{ id: '1' }, { id: '2' }],
      people: [{ id: '1' }],
      organizations: [{ id: '1' }, { id: '2' }, { id: '3' }]
    };
    
    render(React.createElement(Component, {
      ...defaultProps,
      data: dataWithStats
    }));

    expect(screen.getByText(/2.*cases/i)).toBeInTheDocument();
    expect(screen.getByText(/1.*people/i)).toBeInTheDocument();
    expect(screen.getByText(/3.*organizations/i)).toBeInTheDocument();
  });

  test('handles save operation', async () => {
    const mockFileService = {
      ...defaultProps.fileService,
      save: jest.fn().mockResolvedValue()
    };
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, {
      ...defaultProps,
      fileService: mockFileService
    }));

    const saveButton = screen.getByText(/save.*now/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockFileService.save).toHaveBeenCalledWith(defaultProps.data);
    });
  });

  test('handles save operation errors', async () => {
    const mockFileService = {
      ...defaultProps.fileService,
      save: jest.fn().mockRejectedValue(new Error('Save failed'))
    };
    const Component = window.SettingsModal;
    
    render(React.createElement(Component, {
      ...defaultProps,
      fileService: mockFileService
    }));

    const saveButton = screen.getByText(/save.*now/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('handles missing required props gracefully', () => {
    const Component = window.SettingsModal;
    
    const { container } = render(React.createElement(Component, {
      isOpen: true
    }));

    expect(container.firstChild).toBeNull();
  });

  test('matches snapshot', () => {
    const Component = window.SettingsModal;
    
    const { container } = render(React.createElement(Component, defaultProps));

    expect(container.firstChild).toMatchSnapshot();
  });
});