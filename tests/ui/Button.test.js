/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '../../src/components/ui/Button.js';

describe('Button Component', () => {
  test('renders basic button with text', () => {
    render(React.createElement(Button, { children: 'Click me' }));

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
  });

  test('applies primary variant classes by default', () => {
    render(React.createElement(Button, { children: 'Primary Button' }));

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
  });

  test('applies secondary variant classes when specified', () => {
    render(
      React.createElement(Button, {
        variant: 'secondary',
        children: 'Secondary Button',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600');
  });

  test('applies danger variant classes', () => {
    render(
      React.createElement(Button, {
        variant: 'danger',
        children: 'Danger Button',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(
      React.createElement(Button, {
        onClick: handleClick,
        children: 'Clickable',
      })
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(
      React.createElement(Button, {
        disabled: true,
        children: 'Disabled Button',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  test('shows loading state', () => {
    render(
      React.createElement(Button, {
        loading: true,
        children: 'Loading Button',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    // Check for loading spinner
    const spinner = button.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('applies full width class when fullWidth is true', () => {
    render(
      React.createElement(Button, {
        fullWidth: true,
        children: 'Full Width',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  test('applies different size classes', () => {
    const { rerender } = render(
      React.createElement(Button, {
        size: 'sm',
        children: 'Small',
      })
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(
      React.createElement(Button, {
        size: 'lg',
        children: 'Large',
      })
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  test('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(
      React.createElement(Button, {
        disabled: true,
        onClick: handleClick,
        children: 'Disabled',
      })
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('prevents click when loading', () => {
    const handleClick = jest.fn();
    render(
      React.createElement(Button, {
        loading: true,
        onClick: handleClick,
        children: 'Loading',
      })
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  test('applies custom className', () => {
    render(
      React.createElement(Button, {
        className: 'custom-class',
        children: 'Custom',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('applies button type attribute', () => {
    render(
      React.createElement(Button, {
        type: 'submit',
        children: 'Submit',
      })
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
