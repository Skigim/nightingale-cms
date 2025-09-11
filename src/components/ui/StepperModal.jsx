import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, getComponent } from '../../services/registry';

/**
 * Nightingale Component Library - Stepper Modal
 *
 * A reusable modal for multi-step workflows, handling navigation,
 * step validation, and completion logic with enhanced focus management.
 */
function StepperModal({
  isOpen,
  onClose,
  title,
  steps = [],
  currentStep,
  onStepChange,
  onComplete,
  children,
  isStepClickable = () => true, // Function to determine if a step is clickable
  completButtonText = 'Complete', // Custom text for the complete button
  isCompleteDisabled = false, // Whether the complete button should be disabled
  hideNavigation = false, // Whether to hide the Next/Back buttons and use only custom buttons
  customFooterContent = null, // Custom footer content to replace default buttons
}) {
  // Reference to the step content area for focus management
  const stepContentRef = useRef(null);

  if (!isOpen) return null;

  // Enhanced step change handler with focus management
  const handleStepChange = (newStep) => {
    onStepChange(newStep);

    // Focus management for step change
    if (window.NightingaleFocusManager && stepContentRef.current) {
      // Use a slight delay to ensure the step content has updated
      setTimeout(() => {
        window.NightingaleFocusManager.focusStepChange(
          stepContentRef.current,
          newStep,
          {
            onFocused: () => {},
          },
        );
      }, 50);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  // Use custom footer content if provided, otherwise use default navigation
  const footerContent =
    customFooterContent ||
    (!hideNavigation ? (
      <div className="flex justify-between w-full">
        {/* Back Button */}
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          Back
        </button>
        {/* Next/Complete Button */}
        <button
          onClick={isLastStep ? onComplete : handleNext}
          disabled={isLastStep ? isCompleteDisabled : false}
          className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLastStep
              ? 'bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLastStep ? completButtonText : 'Next'}
        </button>
      </div>
    ) : null);

  // Resolve Modal from UI registry without window fallback
  const Modal =
    getComponent('ui', 'Modal') ||
    (() => <div>Modal component not available</div>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
      footerContent={footerContent}
    >
      <div className="flex space-x-8">
        {/* Stepper Navigation */}
        <div className="w-1/4">
          <nav className="space-y-1">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isAccessible = isStepClickable(index);

              return (
                <a
                  key={index}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isAccessible) {
                      handleStepChange(index);
                    }
                  }}
                  className={`group flex items-start p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600/20'
                      : isAccessible
                        ? 'hover:bg-gray-700'
                        : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  {/* Step Icon/Number */}
                  <div
                    className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full font-bold ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  {/* Step Title/Description */}
                  <div className="ml-4">
                    <h4
                      className={`text-sm font-medium ${
                        isActive ? 'text-blue-300' : 'text-white'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </a>
              );
            })}
          </nav>
        </div>
        {/* Step Content */}
        <div
          ref={stepContentRef}
          className="w-3/4 p-4 border-l border-gray-700"
          data-step-content="true"
        >
          {children}
        </div>
      </div>
    </Modal>
  );
}

// PropTypes for validation
StepperModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  currentStep: PropTypes.number.isRequired,
  onStepChange: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  children: PropTypes.node,
  isStepClickable: PropTypes.func,
  completButtonText: PropTypes.string,
  isCompleteDisabled: PropTypes.bool,
  hideNavigation: PropTypes.bool,
  customFooterContent: PropTypes.node,
};

// Register with UI registry
registerComponent('ui', 'StepperModal', StepperModal);

export default StepperModal;
