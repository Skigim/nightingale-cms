/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
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
      'items-center',
      'justify-between',
    );
  });
});
