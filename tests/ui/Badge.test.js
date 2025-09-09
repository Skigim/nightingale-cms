/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  Badge,
  ProgressBadge,
  CountBadge,
  MultiBadge,
} from '../../src/components/ui/Badge.jsx';

describe('Badge Component', () => {
  test('renders status badge with text', () => {
    render(<Badge status="Active" />);

    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-600', 'text-green-100');
  });

  test('applies different variants correctly', () => {
    render(
      <Badge
        status="High"
        variant="priority"
      />,
    );

    const badge = screen.getByText('High');
    expect(badge).toHaveClass('bg-red-600', 'text-red-100');
  });

  test('applies different sizes correctly', () => {
    render(
      <Badge
        status="Test"
        size="lg"
      />,
    );

    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  test('applies custom className', () => {
    render(
      <Badge
        status="Test"
        className="custom-class"
      />,
    );

    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('custom-class');
  });

  test('returns null when no status provided', () => {
    const { container } = render(<Badge />);
    expect(container.firstChild).toBeNull();
  });

  test('has accessibility title attribute', () => {
    render(<Badge status="Active" />);

    const badge = screen.getByText('Active');
    expect(badge).toHaveAttribute('title', 'Active');
  });
});

describe('ProgressBadge Component', () => {
  test('renders progress percentage correctly', () => {
    render(
      <ProgressBadge
        current={75}
        total={100}
      />,
    );

    const badge = screen.getByText('75%');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-600', 'text-blue-100');
  });

  test('renders with custom label', () => {
    render(
      <ProgressBadge
        current={50}
        total={100}
        label="Progress"
      />,
    );

    const badge = screen.getByText('Progress: 50%');
    expect(badge).toBeInTheDocument();
  });

  test('shows completed state for 100%', () => {
    render(
      <ProgressBadge
        current={100}
        total={100}
      />,
    );

    const badge = screen.getByText('100%');
    expect(badge).toHaveClass('bg-green-600', 'text-green-100');
  });
});

describe('CountBadge Component', () => {
  test('renders count correctly', () => {
    render(<CountBadge count={5} />);

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  test('returns null for zero count by default', () => {
    const { container } = render(<CountBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  test('shows zero when showZero is true', () => {
    render(
      <CountBadge
        count={0}
        showZero
      />,
    );

    const badge = screen.getByText('0');
    expect(badge).toBeInTheDocument();
  });

  test('shows max+ for counts exceeding max', () => {
    render(
      <CountBadge
        count={150}
        max={99}
      />,
    );

    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  test('applies variant colors correctly', () => {
    render(
      <CountBadge
        count={5}
        variant="danger"
      />,
    );

    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-red-600', 'text-red-100');
  });
});

describe('MultiBadge Component', () => {
  test('renders multiple badges', () => {
    const badges = [
      { status: 'Active', variant: 'status' },
      { status: 'High', variant: 'priority' },
    ];

    render(<MultiBadge badges={badges} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('returns null for empty badges array', () => {
    const { container } = render(<MultiBadge badges={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('applies spacing classes correctly', () => {
    const badges = [{ status: 'Test' }];
    const { container } = render(
      <MultiBadge
        badges={badges}
        spacing="loose"
      />,
    );

    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveClass('gap-3');
  });
});
