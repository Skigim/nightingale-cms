import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Sidebar from '../../src/components/ui/Sidebar.jsx';

describe('Sidebar Component', () => {
  const defaultProps = {
    activeTab: 'dashboard',
    onTabChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sidebar with CMS heading', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('CMS')).toBeInTheDocument();
  });

  test('renders all navigation tabs', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    expect(screen.getByTitle('Cases')).toBeInTheDocument();
    expect(screen.getByTitle('People')).toBeInTheDocument();
    expect(screen.getByTitle('Organizations')).toBeInTheDocument();
    expect(screen.getByTitle('Eligibility')).toBeInTheDocument();
  });

  test('highlights active tab correctly', () => {
    render(
      <Sidebar
        {...defaultProps}
        activeTab="cases"
      />,
    );

    const casesButton = screen.getByTitle('Cases');
    expect(casesButton).toHaveClass('bg-blue-600', 'text-white');
  });

  test('calls onTabChange when tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    render(
      <Sidebar
        {...defaultProps}
        onTabChange={mockOnTabChange}
      />,
    );

    const peopleButton = screen.getByTitle('People');
    fireEvent.click(peopleButton);

    expect(mockOnTabChange).toHaveBeenCalledWith('people');
  });

  test('shows settings button when onSettingsClick is provided', () => {
    const mockOnSettingsClick = jest.fn();
    render(
      <Sidebar
        {...defaultProps}
        onSettingsClick={mockOnSettingsClick}
      />,
    );

    const settingsButton = screen.getByTitle('Settings');
    expect(settingsButton).toBeInTheDocument();
  });

  test('hides settings button when onSettingsClick is not provided', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.queryByTitle('Settings')).not.toBeInTheDocument();
  });

  test('calls onSettingsClick when settings button is clicked', () => {
    const mockOnSettingsClick = jest.fn();
    render(
      <Sidebar
        {...defaultProps}
        onSettingsClick={mockOnSettingsClick}
      />,
    );

    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);

    expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
  });

  test('shows back button for cases tab in details view', () => {
    const mockOnCaseBackToList = jest.fn();
    render(
      <Sidebar
        {...defaultProps}
        activeTab="cases"
        caseViewMode="details"
        onCaseBackToList={mockOnCaseBackToList}
      />,
    );

    const backButton = screen.getByTitle('Back to Cases List');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveClass('bg-blue-600', 'text-white');
  });

  test('calls onCaseBackToList when back button is clicked', () => {
    const mockOnCaseBackToList = jest.fn();
    render(
      <Sidebar
        {...defaultProps}
        activeTab="cases"
        caseViewMode="details"
        onCaseBackToList={mockOnCaseBackToList}
      />,
    );

    const backButton = screen.getByTitle('Back to Cases List');
    fireEvent.click(backButton);

    expect(mockOnCaseBackToList).toHaveBeenCalledTimes(1);
  });

  test('does not show back button when not in cases details view', () => {
    render(
      <Sidebar
        {...defaultProps}
        activeTab="cases"
      />,
    );

    expect(screen.queryByTitle('Back to Cases List')).not.toBeInTheDocument();
    expect(screen.getByTitle('Cases')).toBeInTheDocument();
  });

  test('returns null when activeTab is not provided', () => {
    const { container } = render(<Sidebar onTabChange={jest.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  test('returns null when onTabChange is not provided', () => {
    const { container } = render(<Sidebar activeTab="dashboard" />);

    expect(container.firstChild).toBeNull();
  });

  test('applies correct CSS classes for layout', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass(
      'w-16',
      'bg-gray-800',
      'border-r',
      'border-gray-700',
      'flex',
      'flex-col',
    );
  });

  test('has proper accessibility attributes on tab buttons', () => {
    render(<Sidebar {...defaultProps} />);

    const dashboardButton = screen.getByTitle('Dashboard');
    expect(dashboardButton).toHaveAttribute('title', 'Dashboard');
    expect(dashboardButton.tagName).toBe('BUTTON');
  });

  test('has proper accessibility attributes on settings button', () => {
    const mockOnSettingsClick = jest.fn();
    render(
      <Sidebar
        {...defaultProps}
        onSettingsClick={mockOnSettingsClick}
      />,
    );

    const settingsButton = screen.getByTitle('Settings');
    expect(settingsButton).toHaveAttribute('title', 'Settings');
    expect(settingsButton.tagName).toBe('BUTTON');
  });

  test('renders SVG icons for all tabs', () => {
    const { container } = render(<Sidebar {...defaultProps} />);

    const svgElements = container.querySelectorAll('svg');
    // Should have 5 tab icons (plus potentially settings icon)
    expect(svgElements.length).toBeGreaterThanOrEqual(5);
  });

  test('handles inactive tabs styling correctly', () => {
    render(
      <Sidebar
        {...defaultProps}
        activeTab="dashboard"
      />,
    );

    const casesButton = screen.getByTitle('Cases');
    expect(casesButton).toHaveClass('text-gray-400');
    expect(casesButton).not.toHaveClass('bg-blue-600');
  });
});
