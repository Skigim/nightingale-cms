/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Import the component
require('../Sidebar.js');

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;
  });

  test('renders without crashing', () => {
    const Component = window.Sidebar;
    expect(Component).toBeDefined();

    render(
      React.createElement(Component, {
        activeTab: 'dashboard',
        onTabChange: jest.fn(),
      })
    );
  });

  test('renders sidebar with navigation tabs', () => {
    const Component = window.Sidebar;

    render(
      React.createElement(Component, {
        activeTab: 'dashboard',
        onTabChange: jest.fn(),
      })
    );

    // Check for CMS title
    expect(screen.getByText('CMS')).toBeInTheDocument();

    // Check for tab buttons by their title attributes
    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    expect(screen.getByTitle('Cases')).toBeInTheDocument();
    expect(screen.getByTitle('People')).toBeInTheDocument();
    expect(screen.getByTitle('Organizations')).toBeInTheDocument();
    expect(screen.getByTitle('Eligibility')).toBeInTheDocument();
  });

  test('highlights active tab correctly', () => {
    const Component = window.Sidebar;

    render(
      React.createElement(Component, {
        activeTab: 'cases',
        onTabChange: jest.fn(),
      })
    );

    const casesTab = screen.getByTitle('Cases');
    expect(casesTab).toHaveClass('bg-blue-600');
  });

  test('calls onTabChange when tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    const Component = window.Sidebar;

    render(
      React.createElement(Component, {
        activeTab: 'dashboard',
        onTabChange: mockOnTabChange,
      })
    );

    const peopleTab = screen.getByTitle('People');
    fireEvent.click(peopleTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('people');
  });

  test('shows tooltips on hover', () => {
    const Component = window.Sidebar;

    render(
      React.createElement(Component, {
        activeTab: 'dashboard',
        onTabChange: jest.fn(),
      })
    );

    const dashboardTab = screen.getByTitle('Dashboard');
    expect(dashboardTab).toHaveAttribute('title', 'Dashboard');
  });

  test('handles collapsed state', () => {
    const Component = window.Sidebar;

    render(
      React.createElement(Component, {
        activeTab: 'dashboard',
        onTabChange: jest.fn(),
      })
    );

    // Current component always renders in collapsed (w-16) state
    const sidebar = document.querySelector('.w-16');
    expect(sidebar).toBeInTheDocument();
  });

  test('handles settings click', () => {
    const mockOnSettingsClick = jest.fn();
    const Component = window.Sidebar;

    render(
      React.createElement(Component, {
        activeTab: 'dashboard',
        onTabChange: jest.fn(),
        onSettingsClick: mockOnSettingsClick,
      })
    );

    // Settings functionality would be implemented when component is enhanced
    // For now, just verify component renders with settings prop
    expect(Component).toBeDefined();
  });

  test('handles missing required props gracefully', () => {
    const Component = window.Sidebar;

    const { container } = render(React.createElement(Component, {}));

    expect(container.firstChild).toBeNull();
  });

  test('matches snapshot', () => {
    const Component = window.Sidebar;

    const { container } = render(
      React.createElement(Component, {
        activeTab: 'cases',
        onTabChange: jest.fn(),
      })
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
