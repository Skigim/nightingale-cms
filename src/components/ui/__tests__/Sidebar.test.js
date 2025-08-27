/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Import the component
require('../Sidebar.js');

describe('Sidebar Component', () => {
  const mockTabs = [
    { id: 'dashboard', title: 'Dashboard', icon: '📊' },
    { id: 'cases', title: 'Cases', icon: '📁' },
    { id: 'people', title: 'People', icon: '👤' }
  ];

  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;
  });

  test('renders without crashing', () => {
    const Component = window.Sidebar;
    expect(Component).toBeDefined();
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'dashboard',
      onTabChange: jest.fn()
    }));
  });

  test('renders all tabs', () => {
    const Component = window.Sidebar;
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'dashboard',
      onTabChange: jest.fn()
    }));

    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  test('highlights active tab correctly', () => {
    const Component = window.Sidebar;
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'cases',
      onTabChange: jest.fn()
    }));

    const casesTab = screen.getByText('📁').closest('button');
    expect(casesTab).toHaveClass('bg-blue-600');
  });

  test('calls onTabChange when tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    const Component = window.Sidebar;
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'dashboard',
      onTabChange: mockOnTabChange
    }));

    const peopleTab = screen.getByText('👤');
    fireEvent.click(peopleTab);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('people');
  });

  test('shows tooltips on hover', () => {
    const Component = window.Sidebar;
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'dashboard',
      onTabChange: jest.fn()
    }));

    const dashboardTab = screen.getByText('📊').closest('button');
    expect(dashboardTab).toHaveAttribute('title', 'Dashboard');
  });

  test('handles collapsed state', () => {
    const Component = window.Sidebar;
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'dashboard',
      onTabChange: jest.fn(),
      collapsed: true
    }));

    const sidebar = document.querySelector('.w-16');
    expect(sidebar).toBeInTheDocument();
  });

  test('handles expanded state', () => {
    const Component = window.Sidebar;
    
    render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'dashboard',
      onTabChange: jest.fn(),
      collapsed: false
    }));

    const sidebar = document.querySelector('.w-64');
    expect(sidebar).toBeInTheDocument();
  });

  test('handles empty tabs array gracefully', () => {
    const Component = window.Sidebar;
    
    const { container } = render(React.createElement(Component, {
      tabs: [],
      activeTab: 'dashboard',
      onTabChange: jest.fn()
    }));

    expect(container.firstChild).toBeInTheDocument();
  });

  test('handles missing required props gracefully', () => {
    const Component = window.Sidebar;
    
    const { container } = render(React.createElement(Component, {}));

    expect(container.firstChild).toBeNull();
  });

  test('matches snapshot', () => {
    const Component = window.Sidebar;
    
    const { container } = render(React.createElement(Component, {
      tabs: mockTabs,
      activeTab: 'cases',
      onTabChange: jest.fn(),
      collapsed: false
    }));

    expect(container.firstChild).toMatchSnapshot();
  });
});