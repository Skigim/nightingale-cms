/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TabHeader from '../../src/components/ui/TabHeader.jsx';

describe('TabHeader Component', () => {
  test('renders with title only', () => {
    render(<TabHeader title="Test Title" />);

    const title = screen.getByText('Test Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('font-bold', 'text-white', 'text-lg');
  });

  test('returns null when no title provided', () => {
    const { container } = render(<TabHeader />);
    expect(container.firstChild).toBeNull();
  });

  test('renders with title and count', () => {
    render(
      <TabHeader
        title="Test Title"
        count="5 items"
      />,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('5 items')).toBeInTheDocument();

    const count = screen.getByText('5 items');
    expect(count).toHaveClass('text-sm', 'text-gray-400');
  });

  test('renders with icon', () => {
    const icon = {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    };
    const { container } = render(
      <TabHeader
        title="Test Title"
        icon={icon}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-8', 'h-8', 'text-blue-400');

    const path = svg.querySelector('path');
    expect(path).toHaveAttribute('d', icon.d);
  });

  test('renders with actions', () => {
    const actions = <button>Action Button</button>;
    render(
      <TabHeader
        title="Test Title"
        actions={actions}
      />,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = render(
      <TabHeader
        title="Test Title"
        className="custom-class"
      />,
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  test('applies iconProps to icon', () => {
    const icon = {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    };
    const iconProps = { 'data-testid': 'custom-icon' };

    render(
      <TabHeader
        title="Test Title"
        icon={icon}
        iconProps={iconProps}
      />,
    );

    const svg = screen.getByTestId('custom-icon');
    expect(svg).toBeInTheDocument();
  });

  test('renders complete TabHeader with all props', () => {
    const icon = {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    };
    const actions = (
      <div>
        <button>Edit</button>
        <button>Delete</button>
      </div>
    );

    const { container } = render(
      <TabHeader
        title="Complete Header"
        count="10 total"
        icon={icon}
        actions={actions}
        className="test-class"
      />,
    );

    expect(screen.getByText('Complete Header')).toBeInTheDocument();
    expect(screen.getByText('10 total')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('has correct layout structure', () => {
    const { container } = render(<TabHeader title="Test" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass(
      'bg-gray-800',
      'rounded-lg',
      'p-4',
      'mb-6',
      'flex',
      'flex-col',
      'space-y-4',
    );
  });

  describe('Tab Navigation Features', () => {
    test('renders with tab navigation when tabs provided', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', active: true },
        { id: 'tab2', label: 'Tab 2', active: false },
        { id: 'tab3', label: 'Tab 3', active: false },
      ];
      const onTabChange = jest.fn();

      render(
        <TabHeader
          title="Tab Test"
          tabs={tabs}
          onTabChange={onTabChange}
        />,
      );

      // Check tablist role
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // Check individual tabs
      const tabButtons = screen.getAllByRole('tab');
      expect(tabButtons).toHaveLength(3);
      
      // Check active tab has aria-selected
      expect(tabButtons[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabButtons[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabButtons[2]).toHaveAttribute('aria-selected', 'false');
    });

    test('handles tab click and calls onTabChange', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', active: true },
        { id: 'tab2', label: 'Tab 2', active: false },
      ];
      const onTabChange = jest.fn();

      render(
        <TabHeader
          title="Tab Test"
          tabs={tabs}
          onTabChange={onTabChange}
        />,
      );

      const secondTab = screen.getByRole('tab', { name: 'Tab 2' });
      fireEvent.click(secondTab);

      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    test('handles keyboard navigation with arrow keys', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', active: true },
        { id: 'tab2', label: 'Tab 2', active: false },
        { id: 'tab3', label: 'Tab 3', active: false },
      ];
      const onTabChange = jest.fn();

      render(
        <TabHeader
          title="Tab Test"
          tabs={tabs}
          onTabChange={onTabChange}
        />,
      );

      const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
      firstTab.focus();

      // Press ArrowRight to move to next tab
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Tab 2' }));

      // Press ArrowLeft to move back
      fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(firstTab);
    });

    test('wraps around when navigating past boundaries', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', active: true },
        { id: 'tab2', label: 'Tab 2', active: false },
      ];
      const onTabChange = jest.fn();

      render(
        <TabHeader
          title="Tab Test"
          tabs={tabs}
          onTabChange={onTabChange}
        />,
      );

      const firstTab = screen.getByRole('tab', { name: 'Tab 1' });
      firstTab.focus();

      // Press ArrowLeft on first tab should wrap to last tab
      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Tab 2' }));

      // Press ArrowRight on last tab should wrap to first tab
      fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(firstTab);
    });

    test('activates tab on Enter and Space keys', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', active: true },
        { id: 'tab2', label: 'Tab 2', active: false },
      ];
      const onTabChange = jest.fn();

      render(
        <TabHeader
          title="Tab Test"
          tabs={tabs}
          onTabChange={onTabChange}
        />,
      );

      const secondTab = screen.getByRole('tab', { name: 'Tab 2' });
      secondTab.focus();

      // Test Enter key
      fireEvent.keyDown(secondTab, { key: 'Enter' });
      expect(onTabChange).toHaveBeenCalledWith('tab2');

      onTabChange.mockClear();

      // Test Space key
      fireEvent.keyDown(secondTab, { key: ' ' });
      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes for header section', () => {
      const { container } = render(
        <TabHeader title="Accessible Header" />
      );

      const header = container.firstChild;
      expect(header).toHaveAttribute('role', 'banner');
    });

    test('title has proper heading role', () => {
      render(<TabHeader title="My Header" />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('My Header');
    });

    test('tabs have proper tabindex management', () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1', active: true },
        { id: 'tab2', label: 'Tab 2', active: false },
        { id: 'tab3', label: 'Tab 3', active: false },
      ];

      render(
        <TabHeader
          title="Tab Test"
          tabs={tabs}
          onTabChange={jest.fn()}
        />,
      );

      const tabButtons = screen.getAllByRole('tab');
      
      // Active tab should have tabindex 0
      expect(tabButtons[0]).toHaveAttribute('tabindex', '0');
      
      // Inactive tabs should have tabindex -1
      expect(tabButtons[1]).toHaveAttribute('tabindex', '-1');
      expect(tabButtons[2]).toHaveAttribute('tabindex', '-1');
    });
  });
});
