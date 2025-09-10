/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Stepper from '../../src/components/ui/Stepper.jsx';

// Mock data
const mockSteps = [
  { title: 'Step 1', description: 'First step description' },
  { title: 'Step 2', description: 'Second step description' },
  { title: 'Step 3', description: 'Third step description' },
];

describe('Stepper Component', () => {
  describe('Basic Rendering', () => {
    test('renders with required props', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);
      
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('First step description')).toBeInTheDocument();
    });

    test('renders null with invalid steps', () => {
      const { container } = render(<Stepper steps={null} currentStep={0} />);
      expect(container.firstChild).toBeNull();
    });

    test('renders null with non-array steps', () => {
      const { container } = render(<Stepper steps="invalid" currentStep={0} />);
      expect(container.firstChild).toBeNull();
    });

    test('renders null with invalid currentStep', () => {
      const { container } = render(<Stepper steps={mockSteps} currentStep="invalid" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Step Status and Styling', () => {
    test('applies completed status to previous steps', () => {
      const { container } = render(<Stepper steps={mockSteps} currentStep={2} />);
      
      // Find step circles with completed styling (green background)
      const completedSteps = container.querySelectorAll('.bg-green-600');
      expect(completedSteps).toHaveLength(2); // Steps 0 and 1 should be completed
    });

    test('applies active status to current step', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      
      const stepLabels = screen.getAllByText(/Step \d/);
      expect(stepLabels[1]).toHaveClass('text-blue-400');
    });

    test('applies pending status to future steps', () => {
      render(<Stepper steps={mockSteps} currentStep={0} />);
      
      const stepLabels = screen.getAllByText(/Step \d/);
      expect(stepLabels[1]).toHaveClass('text-gray-400');
      expect(stepLabels[2]).toHaveClass('text-gray-400');
    });

    test('displays checkmark for completed steps', () => {
      render(<Stepper steps={mockSteps} currentStep={2} />);
      
      // Find SVG checkmarks in completed steps
      const svgElements = document.querySelectorAll('svg path[d="M5 13l4 4L19 7"]');
      expect(svgElements).toHaveLength(2); // Steps 0 and 1 should have checkmarks
    });

    test('displays step numbers for non-completed steps', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Current step
      expect(screen.getByText('3')).toBeInTheDocument(); // Future step
    });
  });

  describe('Progress Bar', () => {
    test('shows progress bar by default', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
    });

    test('hides progress bar when showProgress is false', () => {
      render(<Stepper steps={mockSteps} currentStep={1} showProgress={false} />);
      
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('67%')).not.toBeInTheDocument();
    });

    test('calculates progress percentage correctly', () => {
      const { rerender } = render(<Stepper steps={mockSteps} currentStep={0} />);
      expect(screen.getByText('33%')).toBeInTheDocument();

      rerender(<Stepper steps={mockSteps} currentStep={1} />);
      expect(screen.getByText('67%')).toBeInTheDocument();

      rerender(<Stepper steps={mockSteps} currentStep={2} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    test('calls onStepClick when step is clicked', () => {
      const mockOnStepClick = jest.fn();
      render(
        <Stepper 
          steps={mockSteps} 
          currentStep={2} 
          onStepClick={mockOnStepClick} 
        />
      );
      
      const stepButtons = screen.getAllByRole('button');
      fireEvent.click(stepButtons[0]);
      
      expect(mockOnStepClick).toHaveBeenCalledWith(0);
    });

    test('allows backward navigation by default', () => {
      const mockOnStepClick = jest.fn();
      render(
        <Stepper 
          steps={mockSteps} 
          currentStep={2} 
          onStepClick={mockOnStepClick} 
        />
      );
      
      const stepButtons = screen.getAllByRole('button');
      fireEvent.click(stepButtons[0]); // Click previous step
      
      expect(mockOnStepClick).toHaveBeenCalledWith(0);
    });

    test('prevents backward navigation when allowBackward is false', () => {
      const mockOnStepClick = jest.fn();
      render(
        <Stepper 
          steps={mockSteps} 
          currentStep={2} 
          onStepClick={mockOnStepClick}
          allowBackward={false}
        />
      );
      
      // Should only be able to click current step (step 2)
      const allElements = screen.getAllByText(/\d+/);
      const clickableElements = allElements.filter(el => el.closest('button'));
      expect(clickableElements).toHaveLength(1);
    });

    test('uses custom isClickable function', () => {
      const mockOnStepClick = jest.fn();
      const customIsClickable = (stepIndex) => stepIndex === 1; // Only step 1 is clickable
      
      render(
        <Stepper 
          steps={mockSteps} 
          currentStep={2} 
          onStepClick={mockOnStepClick}
          isClickable={customIsClickable}
        />
      );
      
      // Should only have one clickable button (step 1)
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    test('renders non-clickable steps as divs when no onStepClick provided', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      
      // Should not have any clickable buttons
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    test('provides proper button semantics for clickable steps', () => {
      const mockOnStepClick = jest.fn();
      render(
        <Stepper 
          steps={mockSteps} 
          currentStep={2} 
          onStepClick={mockOnStepClick} 
        />
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('class');
      });
    });

    test('step descriptions are visible and readable', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      
      expect(screen.getByText('First step description')).toBeInTheDocument();
      expect(screen.getByText('Second step description')).toBeInTheDocument();
      expect(screen.getByText('Third step description')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles single step', () => {
      const singleStep = [{ title: 'Only Step' }];
      render(<Stepper steps={singleStep} currentStep={0} />);
      
      expect(screen.getByText('Only Step')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('handles steps without descriptions', () => {
      const stepsWithoutDesc = [
        { title: 'Step 1' },
        { title: 'Step 2' },
      ];
      render(<Stepper steps={stepsWithoutDesc} currentStep={0} />);
      
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    test('handles currentStep beyond steps length', () => {
      render(<Stepper steps={mockSteps} currentStep={5} />);
      
      // All steps should be completed
      const stepLabels = screen.getAllByText(/Step \d/);
      stepLabels.forEach(label => {
        expect(label).toHaveClass('text-green-400');
      });
    });

    test('handles negative currentStep', () => {
      render(<Stepper steps={mockSteps} currentStep={-1} />);
      
      // All steps should be pending
      const stepLabels = screen.getAllByText(/Step \d/);
      stepLabels.forEach(label => {
        expect(label).toHaveClass('text-gray-400');
      });
    });
  });

  describe('Visual Interactions', () => {
    test('applies hover effects to clickable steps', () => {
      const mockOnStepClick = jest.fn();
      render(
        <Stepper 
          steps={mockSteps} 
          currentStep={2} 
          onStepClick={mockOnStepClick} 
        />
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:scale-105');
        expect(button).toHaveClass('cursor-pointer');
      });
    });

    test('does not apply hover effects to non-clickable steps', () => {
      render(<Stepper steps={mockSteps} currentStep={1} />);
      
      // No buttons should exist for non-clickable version
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });
});