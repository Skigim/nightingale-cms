/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StepperModal from '../../src/components/ui/StepperModal.jsx';

// Mock Modal component
const MockModal = ({
  isOpen,
  onClose,
  title,
  size,
  footerContent,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div data-testid="modal">
      <div data-testid="modal-title">{title}</div>
      <div data-testid="modal-size">{size}</div>
      <div data-testid="modal-content">{children}</div>
      {footerContent && <div data-testid="modal-footer">{footerContent}</div>}
      <button
        data-testid="modal-close"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

// Mock global Modal
beforeAll(() => {
  window.Modal = MockModal;
});

afterAll(() => {
  delete window.Modal;
});

// Mock data
const mockSteps = [
  { title: 'Step 1', description: 'First step description' },
  { title: 'Step 2', description: 'Second step description' },
  { title: 'Step 3', description: 'Third step description' },
];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  title: 'Test Stepper Modal',
  steps: mockSteps,
  currentStep: 0,
  onStepChange: jest.fn(),
  onComplete: jest.fn(),
};

describe('StepperModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders when isOpen is true', () => {
      render(<StepperModal {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Test Stepper Modal',
      );
      expect(screen.getByTestId('modal-size')).toHaveTextContent('large');
    });

    test('does not render when isOpen is false', () => {
      render(
        <StepperModal
          {...defaultProps}
          isOpen={false}
        />,
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('renders all steps in navigation', () => {
      render(<StepperModal {...defaultProps} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('First step description')).toBeInTheDocument();
    });

    test('renders children content', () => {
      render(
        <StepperModal {...defaultProps}>
          <div>Step content goes here</div>
        </StepperModal>,
      );

      expect(screen.getByText('Step content goes here')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    test('displays correct step numbers and checkmarks', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
        />,
      );

      // First two steps should show checkmarks (completed)
      expect(screen.getAllByText('✓')).toHaveLength(2);
      // Current step should show step number
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('applies correct styling to active step', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
        />,
      );

      const activeStepTitle = screen.getByText('Step 2');
      expect(activeStepTitle).toHaveClass('text-blue-300');
    });

    test('applies correct styling to completed steps', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
        />,
      );

      // Find only the step indicators with completed styling
      const completedStepIndicators =
        document.querySelectorAll('nav .bg-green-600');
      expect(completedStepIndicators).toHaveLength(2);
    });

    test('applies correct styling to current step', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
        />,
      );

      const currentStep = document.querySelector('.bg-blue-600');
      expect(currentStep).toBeInTheDocument();
    });
  });

  describe('Step Click Interaction', () => {
    test('calls onStepChange when step is clicked', () => {
      const mockOnStepChange = jest.fn();
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
          onStepChange={mockOnStepChange}
        />,
      );

      const firstStepLink = screen.getByText('Step 1').closest('a');
      fireEvent.click(firstStepLink);

      expect(mockOnStepChange).toHaveBeenCalledWith(0);
    });

    test('respects isStepClickable function', () => {
      const mockOnStepChange = jest.fn();
      const isStepClickable = (stepIndex) => stepIndex <= 1; // Only first two steps clickable

      render(
        <StepperModal
          {...defaultProps}
          currentStep={0}
          onStepChange={mockOnStepChange}
          isStepClickable={isStepClickable}
        />,
      );

      // Step 3 should not be clickable
      const thirdStepLink = screen.getByText('Step 3').closest('a');
      expect(thirdStepLink).toHaveClass('cursor-not-allowed');
      expect(thirdStepLink).toHaveClass('opacity-50');
    });

    test('prevents default link behavior', () => {
      const mockOnStepChange = jest.fn();
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
          onStepChange={mockOnStepChange}
        />,
      );

      const firstStepLink = screen.getByText('Step 1').closest('a');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(clickEvent, 'preventDefault', {
        value: jest.fn(),
      });

      firstStepLink.dispatchEvent(clickEvent);
      expect(clickEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Footer Navigation Buttons', () => {
    test('renders Back and Next buttons by default', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
        />,
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    test('disables Back button on first step', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={0}
        />,
      );

      const backButton = screen.getByText('Back');
      expect(backButton).toBeDisabled();
      expect(backButton).toHaveClass('disabled:opacity-50');
    });

    test('shows Complete button on last step', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
        />,
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    test('uses custom complete button text', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
          completeButtonText="Finish"
        />,
      );

      expect(screen.getByText('Finish')).toBeInTheDocument();
    });

    test('disables complete button when isCompleteDisabled is true', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
          isCompleteDisabled={true}
        />,
      );

      const completeButton = screen.getByText('Complete');
      expect(completeButton).toBeDisabled();
    });
  });

  describe('Button Click Handlers', () => {
    test('Back button calls onStepChange with previous step', () => {
      const mockOnStepChange = jest.fn();
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
          onStepChange={mockOnStepChange}
        />,
      );

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockOnStepChange).toHaveBeenCalledWith(0);
    });

    test('Next button calls onStepChange with next step', () => {
      const mockOnStepChange = jest.fn();
      render(
        <StepperModal
          {...defaultProps}
          currentStep={0}
          onStepChange={mockOnStepChange}
        />,
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockOnStepChange).toHaveBeenCalledWith(1);
    });

    test('Complete button calls onComplete', () => {
      const mockOnComplete = jest.fn();
      render(
        <StepperModal
          {...defaultProps}
          currentStep={2}
          onComplete={mockOnComplete}
        />,
      );

      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('Custom Footer Content', () => {
    test('renders custom footer content when provided', () => {
      const customFooter = <div data-testid="custom-footer">Custom footer</div>;
      render(
        <StepperModal
          {...defaultProps}
          customFooterContent={customFooter}
        />,
      );

      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    test('hides navigation when hideNavigation is true', () => {
      render(
        <StepperModal
          {...defaultProps}
          hideNavigation={true}
        />,
      );

      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('sets up step content ref for focus management', () => {
      render(<StepperModal {...defaultProps} />);

      const stepContent = document.querySelector('[data-step-content="true"]');
      expect(stepContent).toBeInTheDocument();
      expect(stepContent).toHaveClass('w-3/4');
      expect(stepContent).toHaveClass('p-4');
      expect(stepContent).toHaveClass('border-l');
      expect(stepContent).toHaveClass('border-gray-700');
    });

    test('calls focus manager when available', (done) => {
      // Mock focus manager
      window.NightingaleFocusManager = {
        focusStepChange: jest.fn(),
      };

      const mockOnStepChange = jest.fn();
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
          onStepChange={mockOnStepChange}
        />,
      );

      const firstStepLink = screen.getByText('Step 1').closest('a');
      fireEvent.click(firstStepLink);

      // Focus manager is called with a timeout
      setTimeout(() => {
        expect(
          window.NightingaleFocusManager.focusStepChange,
        ).toHaveBeenCalled();
        delete window.NightingaleFocusManager;
        done();
      }, 60);
    });
  });

  describe('Edge Cases', () => {
    test('renders with only required minimal props', () => {
      render(
        <StepperModal
          isOpen={true}
          onClose={() => {}}
          title="Minimal"
        >
          <div>Content</div>
        </StepperModal>,
      );
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
    test('handles empty steps array', () => {
      render(
        <StepperModal
          {...defaultProps}
          steps={[]}
        />,
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      // Should not crash and should still render the modal structure
    });

    test('handles missing step descriptions', () => {
      const stepsWithoutDesc = [{ title: 'Step 1' }, { title: 'Step 2' }];
      render(
        <StepperModal
          {...defaultProps}
          steps={stepsWithoutDesc}
        />,
      );

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    test('handles currentStep beyond array bounds', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={10}
        />,
      );

      // Should not crash; steps beyond max clamp to last index so only prior steps show completed
      expect(screen.getAllByText('✓')).toHaveLength(2);
    });

    test('handles negative currentStep', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={-1}
        />,
      );

      // Should not crash, all steps should appear as pending
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper link semantics for step navigation', () => {
      render(<StepperModal {...defaultProps} />);

      const stepLinks = screen.getAllByRole('link');
      expect(stepLinks).toHaveLength(3);

      stepLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '#');
      });
    });

    test('provides proper button semantics for navigation', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
        />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      const backButton = screen.getByText('Back');
      const nextButton = screen.getByText('Next');

      // HTML buttons don't need explicit type="button" - it's the default
      expect(backButton.tagName).toBe('BUTTON');
      expect(nextButton.tagName).toBe('BUTTON');
    });

    test('provides proper step status indication', () => {
      render(
        <StepperModal
          {...defaultProps}
          currentStep={1}
        />,
      );

      const completedStep = screen.getByText('✓');
      const activeStepNumber = screen.getByText('2');
      const pendingStepNumber = screen.getByText('3');

      expect(completedStep).toBeInTheDocument();
      expect(activeStepNumber).toBeInTheDocument();
      expect(pendingStepNumber).toBeInTheDocument();
    });
  });
});
