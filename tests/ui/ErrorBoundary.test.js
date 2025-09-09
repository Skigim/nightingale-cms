/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../src/components/ui/ErrorBoundary.jsx';

// Mock component that throws an error when instructed
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error from ThrowError component');
  }
  return <div>No error</div>;
};

// Mock component that always works
const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests since we're intentionally causing errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: jest.fn(),
      },
      writable: true,
    });
  });

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  test('renders error UI when child component throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/The application encountered an error/),
    ).toBeInTheDocument();
    expect(screen.getByText('Reload Application')).toBeInTheDocument();
  });

  test('shows technical details when expanded', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const details = screen.getByText('Technical Details');
    expect(details).toBeInTheDocument();

    // Click to expand details
    fireEvent.click(details);

    // Should show error details in a pre element
    const errorDetails = screen.getByText(
      /Test error from ThrowError component/,
    );
    expect(errorDetails).toBeInTheDocument();
    expect(errorDetails.tagName).toBe('PRE');
  });

  test('reload button calls window.location.reload', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByText('Reload Application');
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  test('has correct styling for error UI', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const errorContainer = container.querySelector('.bg-gray-900');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass(
      'h-full',
      'w-full',
      'flex',
      'items-center',
      'justify-center',
      'bg-gray-900',
      'text-white',
      'p-8',
    );
  });

  test('error boundary catches errors during rendering', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    // Initially no error
    expect(screen.getByText('No error')).toBeInTheDocument();

    // Trigger error by re-rendering with shouldThrow=true
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Should now show error boundary UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  test('error boundary handles componentDidCatch lifecycle', () => {
    const errorBoundary = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Should render error UI, indicating componentDidCatch was called
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('renders with proper accessibility structure', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Check for proper heading structure
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Something went wrong');

    // Check for button
    const button = screen.getByRole('button', { name: 'Reload Application' });
    expect(button).toBeInTheDocument();

    // Check for details/summary structure
    const details = screen.getByText('Technical Details');
    expect(details.tagName).toBe('SUMMARY');
  });
});
