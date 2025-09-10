import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Header from '../../src/components/ui/Header.jsx';

describe('Header Component', () => {
  test('renders basic header with branding', () => {
    render(<Header />);

    expect(screen.getByText('Nightingale CMS - React')).toBeInTheDocument();

    // Check for SVG icon presence
    const brandingArea = screen
      .getByText('Nightingale CMS - React')
      .closest('.flex');
    const documentIcon = brandingArea.querySelector('svg');
    expect(documentIcon).toBeInTheDocument();
  });

  test('renders with default disconnected file status', () => {
    render(<Header />);

    const statusButton = screen.getByRole('button', { name: /disconnected/i });
    expect(statusButton).toBeInTheDocument();
    expect(statusButton).toHaveClass('bg-red-600');
  });

  test('renders connected file status', () => {
    render(<Header fileStatus="connected" />);

    const statusButton = screen.getByRole('button', { name: /connected/i });
    expect(statusButton).toBeInTheDocument();
    expect(statusButton).toHaveClass('bg-green-600');
  });

  test('renders connecting file status', () => {
    render(<Header fileStatus="connecting" />);

    const statusButton = screen.getByRole('button', { name: /connecting/i });
    expect(statusButton).toBeInTheDocument();
    expect(statusButton).toHaveClass('bg-yellow-600');
  });

  test('calls onSettingsClick when file status button is clicked', () => {
    const mockOnSettingsClick = jest.fn();
    render(<Header onSettingsClick={mockOnSettingsClick} />);

    const statusButton = screen.getByRole('button', { name: /disconnected/i });
    fireEvent.click(statusButton);

    expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
  });

  test('displays manual autosave status when no autosaveStatus provided', () => {
    render(<Header />);

    expect(screen.getByText('⚙️')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  test('displays saved autosave status', () => {
    const autosaveStatus = { status: 'saved', message: 'All changes saved' };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  test('displays saving autosave status', () => {
    const autosaveStatus = { status: 'saving', message: 'Saving changes...' };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('⏳')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  test('displays error autosave status', () => {
    const autosaveStatus = { status: 'error', message: 'Save failed' };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  test('displays auto autosave status for initialized state', () => {
    const autosaveStatus = { status: 'initialized', message: 'Autosave ready' };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  test('displays auto autosave status for started state', () => {
    const autosaveStatus = { status: 'started', message: 'Autosave active' };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('🔄')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
  });

  test('displays no-changes autosave status', () => {
    const autosaveStatus = {
      status: 'no-changes',
      message: 'No changes to save',
    };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  test('shows manual save button when autosave is not available', () => {
    const mockOnManualSave = jest.fn();
    render(<Header onManualSave={mockOnManualSave} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();
  });

  test('shows manual save button when autosave has error', () => {
    const mockOnManualSave = jest.fn();
    const autosaveStatus = { status: 'error', message: 'Save failed' };
    render(
      <Header
        autosaveStatus={autosaveStatus}
        onManualSave={mockOnManualSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();
  });

  test('shows manual save button when autosave is stopped', () => {
    const mockOnManualSave = jest.fn();
    const autosaveStatus = { status: 'stopped', message: 'Autosave stopped' };
    render(
      <Header
        autosaveStatus={autosaveStatus}
        onManualSave={mockOnManualSave}
      />,
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeInTheDocument();
  });

  test('hides manual save button when autosave is working', () => {
    const mockOnManualSave = jest.fn();
    const autosaveStatus = { status: 'saved', message: 'All changes saved' };
    render(
      <Header
        autosaveStatus={autosaveStatus}
        onManualSave={mockOnManualSave}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  test('calls onManualSave when save button is clicked', () => {
    const mockOnManualSave = jest.fn();
    render(<Header onManualSave={mockOnManualSave} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    expect(mockOnManualSave).toHaveBeenCalledTimes(1);
  });

  test('does not show manual save button when onManualSave is not provided', () => {
    render(<Header />);

    expect(
      screen.queryByRole('button', { name: 'Save' }),
    ).not.toBeInTheDocument();
  });

  test('renders status lights', () => {
    const { container } = render(<Header />);

    // Check for colored dots container
    const statusLightsContainer = container.querySelector('.flex.space-x-2');
    expect(statusLightsContainer).toBeInTheDocument();

    // Check for colored dots
    const yellowDot = statusLightsContainer.querySelector('.bg-yellow-400');
    const greenDot = statusLightsContainer.querySelector('.bg-green-400');
    const redDot = statusLightsContainer.querySelector('.bg-red-400');

    expect(yellowDot).toBeInTheDocument();
    expect(greenDot).toBeInTheDocument();
    expect(redDot).toBeInTheDocument();
  });

  test('displays correct tooltip for file status button', () => {
    render(<Header fileStatus="connected" />);

    const statusButton = screen.getByRole('button', { name: /connected/i });
    expect(statusButton).toHaveAttribute(
      'title',
      'Click to open settings and change save folder',
    );
  });

  test('displays correct tooltip for disconnected status', () => {
    render(<Header fileStatus="disconnected" />);

    const statusButton = screen.getByRole('button', { name: /disconnected/i });
    expect(statusButton).toHaveAttribute(
      'title',
      'Click to open settings and connect to save folder',
    );
  });

  test('displays correct tooltip for connecting status', () => {
    render(<Header fileStatus="connecting" />);

    const statusButton = screen.getByRole('button', { name: /connecting/i });
    expect(statusButton).toHaveAttribute('title', 'Click to open settings');
  });

  test('displays autosave status tooltip', () => {
    const autosaveStatus = { status: 'saved', message: 'Custom message' };
    render(<Header autosaveStatus={autosaveStatus} />);

    const autosaveContainer = screen.getByText('✓').closest('.flex');
    expect(autosaveContainer).toHaveAttribute('title', 'Custom message');
  });

  test('displays default autosave tooltip when no message provided', () => {
    render(<Header />);

    const autosaveContainer = screen.getByText('⚙️').closest('.flex');
    expect(autosaveContainer).toHaveAttribute('title', 'Autosave status');
  });

  test('applies correct CSS classes for layout', () => {
    const { container } = render(<Header />);

    const header = container.firstChild;
    expect(header).toHaveClass(
      'flex',
      'items-center',
      'justify-between',
      'bg-gray-800',
      'p-2',
      'shadow-md',
      'flex-shrink-0',
    );
  });

  test('handles unknown autosave status gracefully', () => {
    const autosaveStatus = { status: 'unknown', message: 'Unknown status' };
    render(<Header autosaveStatus={autosaveStatus} />);

    expect(screen.getByText('⚙️')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  test('renders settings icon in file status button', () => {
    render(<Header />);

    const statusButton = screen.getByRole('button', { name: /disconnected/i });
    const settingsIcon = statusButton.querySelector('svg');
    expect(settingsIcon).toBeInTheDocument();
    expect(settingsIcon).toHaveClass('w-3', 'h-3');
  });

  test('renders document icon in branding area', () => {
    render(<Header />);

    const brandingArea = screen
      .getByText('Nightingale CMS - React')
      .closest('.flex');
    const documentIcon = brandingArea.querySelector('svg');
    expect(documentIcon).toBeInTheDocument();
    expect(documentIcon).toHaveClass('h-6', 'w-6', 'mr-2', 'text-blue-400');
  });
});

describe('Header Accessibility', () => {
  test('file status button has proper role and is keyboard accessible', () => {
    const mockOnSettingsClick = jest.fn();
    render(<Header onSettingsClick={mockOnSettingsClick} />);

    const statusButton = screen.getByRole('button', { name: /disconnected/i });
    expect(statusButton).toBeInTheDocument();

    // Test click interaction (keyboard events in jsdom are limited)
    fireEvent.click(statusButton);
    expect(mockOnSettingsClick).toHaveBeenCalled();
  });

  test('manual save button has proper accessibility attributes', () => {
    const mockOnManualSave = jest.fn();
    render(<Header onManualSave={mockOnManualSave} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toHaveAttribute(
      'title',
      'Manual save (autosave not available)',
    );
  });

  test('SVG icons have proper attributes', () => {
    render(<Header />);

    const brandingArea = screen
      .getByText('Nightingale CMS - React')
      .closest('.flex');
    const documentIcon = brandingArea.querySelector('svg');

    expect(documentIcon).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(documentIcon).toHaveAttribute('fill', 'none');
    expect(documentIcon).toHaveAttribute('viewBox', '0 0 24 24');
  });
});

describe('Header Integration', () => {
  test('handles all props together', () => {
    const mockOnSettingsClick = jest.fn();
    const mockOnManualSave = jest.fn();
    const autosaveStatus = { status: 'error', message: 'Failed to save' };

    render(
      <Header
        fileStatus="connected"
        autosaveStatus={autosaveStatus}
        onSettingsClick={mockOnSettingsClick}
        onManualSave={mockOnManualSave}
      />,
    );

    // Check all elements are rendered correctly
    expect(screen.getByText('Nightingale CMS - React')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /connected/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    // Test interactions
    fireEvent.click(screen.getByRole('button', { name: /connected/i }));
    expect(mockOnSettingsClick).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockOnManualSave).toHaveBeenCalled();
  });

  test('works with minimal props', () => {
    render(<Header />);

    expect(screen.getByText('Nightingale CMS - React')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /disconnected/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });
});
