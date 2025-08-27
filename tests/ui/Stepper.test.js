/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Import the component
require('../Stepper.js');

describe('Stepper Component', () => {
  const mockSteps = [
    { title: 'Step 1', description: 'First step' },
    { title: 'Step 2', description: 'Second step' },
    { title: 'Step 3', description: 'Third step' },
  ];

  beforeEach(() => {
    // Ensure React is available globally
    global.window = window;
    window.React = React;
  });

  test('renders without crashing', () => {
    const Component = window.Stepper;
    expect(Component).toBeDefined();

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 0,
      })
    );
  });

  test('renders all steps', () => {
    const Component = window.Stepper;

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 1,
      })
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  test('highlights current step correctly', () => {
    const Component = window.Stepper;

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 1,
      })
    );

    const step2 = screen.getByText('Step 2').closest('button');
    expect(step2).toHaveClass('bg-blue-600');
  });

  test('calls onStepClick when step is clicked', () => {
    const mockOnStepClick = jest.fn();
    const Component = window.Stepper;

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 1,
        onStepClick: mockOnStepClick,
      })
    );

    const step1 = screen.getByText('Step 1');
    fireEvent.click(step1);

    expect(mockOnStepClick).toHaveBeenCalledWith(0);
  });

  test('shows progress bar when showProgress is true', () => {
    const Component = window.Stepper;

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 1,
        showProgress: true,
      })
    );

    const progressBar = document.querySelector('.bg-blue-600[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  test('hides progress bar when showProgress is false', () => {
    const Component = window.Stepper;

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 1,
        showProgress: false,
      })
    );

    const progressBar = document.querySelector('.bg-blue-600[style*="width"]');
    expect(progressBar).not.toBeInTheDocument();
  });

  test('handles empty steps array gracefully', () => {
    const Component = window.Stepper;

    const { container } = render(
      React.createElement(Component, {
        steps: [],
        currentStep: 0,
      })
    );

    expect(container.firstChild).toBeNull();
  });

  test('handles invalid currentStep gracefully', () => {
    const Component = window.Stepper;

    const { container } = render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 'invalid',
      })
    );

    expect(container.firstChild).toBeNull();
  });

  test('respects allowBackward setting', () => {
    const mockOnStepClick = jest.fn();
    const Component = window.Stepper;

    render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 2,
        onStepClick: mockOnStepClick,
        allowBackward: false,
      })
    );

    const step1 = screen.getByText('Step 1');
    fireEvent.click(step1);

    // Should not call onStepClick for previous steps when allowBackward is false
    expect(mockOnStepClick).not.toHaveBeenCalled();
  });

  test('matches snapshot', () => {
    const Component = window.Stepper;

    const { container } = render(
      React.createElement(Component, {
        steps: mockSteps,
        currentStep: 1,
        showProgress: true,
        allowBackward: true,
      })
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
