/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Import the component
require('../Header.js');

describe('Header Component', () => {
  const defaultProps = {
    fileStatus: 'connected',
    isDirty: false,
    autosaveStatus: { status: 'idle', message: 'Ready' },
    onManualSave: jest.fn(),
    onSettingsClick: jest.fn()
  };

  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const Component = window.Header;
    expect(Component).toBeDefined();
    
    render(React.createElement(Component, defaultProps));
  });

  test('displays application title', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText('Nightingale CMS - React')).toBeInTheDocument();
  });

  test('shows connected file status', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      fileStatus: 'connected'
    }));

    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });

  test('shows disconnected file status', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      fileStatus: 'disconnected'
    }));

    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
  });

  test('shows dirty indicator when changes are unsaved', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      isDirty: true
    }));

    // Header component doesn't show "unsaved changes" text, it shows indicators via styles
    // Let's check for the dirty state through the save button being enabled
    const saveButton = screen.getByText(/save/i);
    expect(saveButton).not.toBeDisabled();
  });

  test('shows autosave status', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      autosaveStatus: { status: 'saving', message: 'Saving...' }
    }));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  test('calls onManualSave when save button is clicked', () => {
    const mockOnManualSave = jest.fn();
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      onManualSave: mockOnManualSave
    }));

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);
    
    expect(mockOnManualSave).toHaveBeenCalled();
  });

  test('calls onSettingsClick when settings button is clicked', () => {
    const mockOnSettingsClick = jest.fn();
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      onSettingsClick: mockOnSettingsClick
    }));

    const settingsButton = screen.getByLabelText(/settings/i);
    fireEvent.click(settingsButton);
    
    expect(mockOnSettingsClick).toHaveBeenCalled();
  });

  test('disables save button when not dirty and connected', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      isDirty: false,
      fileStatus: 'connected'
    }));

    const saveButton = screen.getByText(/save/i);
    expect(saveButton).toBeDisabled();
  });

  test('enables save button when dirty or disconnected', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      isDirty: true,
      fileStatus: 'connected'
    }));

    const saveButton = screen.getByText(/save/i);
    expect(saveButton).not.toBeDisabled();
  });

  test('shows error status correctly', () => {
    const Component = window.Header;
    
    render(React.createElement(Component, {
      ...defaultProps,
      fileStatus: 'error'
    }));

    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  test('handles missing props gracefully', () => {
    const Component = window.Header;
    
    const { container } = render(React.createElement(Component, {}));

    expect(container.firstChild).toBeNull();
  });

  test('matches snapshot', () => {
    const Component = window.Header;
    
    const { container } = render(React.createElement(Component, {
      ...defaultProps,
      isDirty: true,
      autosaveStatus: { status: 'saved', message: 'Auto-saved 2 minutes ago' }
    }));

    expect(container.firstChild).toMatchSnapshot();
  });
});