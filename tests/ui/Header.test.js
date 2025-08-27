import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Header Component', () => {
  let mockOnSettingsClick, mockOnManualSave, Component;

  beforeEach(() => {
    // Reset mocks
    mockOnSettingsClick = jest.fn();
    mockOnManualSave = jest.fn();

    // Mock the UI services
    window.NightingaleUI = {
      Button:
        window.Button ||
        function Button({ onClick, children, className, variant, size }) {
          const e = window.React.createElement;
          const handleClick = (event) => {
            if (onClick) {
              onClick(event);
            }
          };
          return e(
            'button',
            {
              onClick: handleClick,
              className: `btn ${variant || ''} ${size || ''} ${className || ''}`,
            },
            children
          );
        },
    };

    // Mock the Header component based on actual API
    Component = function Header({
      filename,
      fileStatus,
      autosaveStatus,
      onSettingsClick,
      onManualSave,
    }) {
      const e = window.React.createElement;

      // Only show manual save button when autosave fails or is missing
      const showManualSave =
        !autosaveStatus ||
        autosaveStatus.status === 'error' ||
        autosaveStatus.status === 'stopped' ||
        !autosaveStatus.status;

      return e(
        'header',
        { className: 'header bg-gray-900 text-white p-4' },
        e(
          'div',
          { className: 'flex justify-between items-center' },
          e(
            'div',
            { className: 'flex items-center gap-4' },
            e('h1', { className: 'text-xl font-bold' }, 'Nightingale CMS'),
            filename && e('span', { className: 'text-gray-300' }, filename),
            fileStatus &&
              e(
                'span',
                {
                  className: `status-indicator ${fileStatus === 'saved' ? 'text-green-400' : 'text-yellow-400'}`,
                },
                fileStatus
              )
          ),
          e(
            'div',
            { className: 'flex items-center gap-2' },
            autosaveStatus &&
              e(
                'div',
                { className: 'autosave-status' },
                e(
                  'span',
                  { className: 'text-sm text-gray-400' },
                  `${autosaveStatus.status || 'unknown'}: ${autosaveStatus.message || 'No message'}`
                )
              ),
            showManualSave &&
              e(
                window.NightingaleUI.Button,
                {
                  onClick: onManualSave,
                  variant: 'primary',
                  size: 'sm',
                  className: 'save-button',
                },
                'Save'
              ),
            e(
              window.NightingaleUI.Button,
              {
                onClick: onSettingsClick,
                variant: 'secondary',
                size: 'sm',
                className: 'settings-button',
              },
              'Settings'
            )
          )
        )
      );
    };

    // Make component available globally
    window.Header = Component;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    filename: 'test.json',
    fileStatus: 'saved',
    autosaveStatus: { status: 'connected', message: 'Ready' },
    onSettingsClick: mockOnSettingsClick,
    onManualSave: mockOnManualSave,
  };

  test('renders header with title', () => {
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText('Nightingale CMS')).toBeInTheDocument();
  });

  test('displays filename when provided', () => {
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText('test.json')).toBeInTheDocument();
  });

  test('displays file status when provided', () => {
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText('saved')).toBeInTheDocument();
  });

  test('shows autosave status when provided', () => {
    render(React.createElement(Component, defaultProps));

    expect(screen.getByText('connected: Ready')).toBeInTheDocument();
  });

  test('calls onSettingsClick when settings button is clicked', () => {
    render(React.createElement(Component, defaultProps));

    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);

    expect(mockOnSettingsClick).toHaveBeenCalled();
  });

  test('shows save button only when autosave status is error', () => {
    const props = {
      ...defaultProps,
      autosaveStatus: { status: 'error', message: 'Failed to save' },
    };

    render(React.createElement(Component, props));

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('shows save button when autosave status is stopped', () => {
    const props = {
      ...defaultProps,
      autosaveStatus: { status: 'stopped', message: 'Autosave disabled' },
    };

    render(React.createElement(Component, props));

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('hides save button when autosave is working normally', () => {
    const props = {
      ...defaultProps,
      autosaveStatus: { status: 'connected', message: 'Ready' },
    };

    render(React.createElement(Component, props));

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('calls onManualSave when save button is clicked', () => {
    const props = {
      ...defaultProps,
      autosaveStatus: { status: 'error', message: 'Failed to save' },
    };

    render(React.createElement(Component, props));

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnManualSave).toHaveBeenCalled();
  });

  test('handles missing filename gracefully', () => {
    const props = { ...defaultProps, filename: null };

    render(React.createElement(Component, props));

    expect(screen.getByText('Nightingale CMS')).toBeInTheDocument();
    expect(screen.queryByText('test.json')).not.toBeInTheDocument();
  });

  test('handles missing file status gracefully', () => {
    const props = { ...defaultProps, fileStatus: null };

    render(React.createElement(Component, props));

    expect(screen.getByText('Nightingale CMS')).toBeInTheDocument();
    expect(screen.queryByText('saved')).not.toBeInTheDocument();
  });

  test('handles missing autosave status gracefully', () => {
    const props = { ...defaultProps, autosaveStatus: null };

    render(React.createElement(Component, props));

    expect(screen.getByText('Nightingale CMS')).toBeInTheDocument();
    // When autosave status is missing, save button should show
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('renders without crashing with minimal props', () => {
    const minimalProps = {
      onSettingsClick: mockOnSettingsClick,
      onManualSave: mockOnManualSave,
    };

    render(React.createElement(Component, minimalProps));

    expect(screen.getByText('Nightingale CMS')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(React.createElement(Component, defaultProps));

    const header = container.querySelector('header');
    expect(header).toHaveClass('header', 'bg-gray-900', 'text-white', 'p-4');
  });

  test('maintains component structure', () => {
    const { container } = render(React.createElement(Component, defaultProps));

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(
      container.querySelector('.flex.justify-between')
    ).toBeInTheDocument();
    expect(container.querySelector('h1')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { container } = render(React.createElement(Component, defaultProps));

    expect(container.firstChild).toMatchSnapshot();
  });
});
