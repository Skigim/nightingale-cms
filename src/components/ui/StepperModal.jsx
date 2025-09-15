import React, { useRef, useEffect, useCallback } from 'react';
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
  completeButtonText = 'Complete', // Custom text for the complete button
  isCompleteDisabled = false, // Whether the complete button should be disabled
  hideNavigation = false, // Whether to hide the Next/Back buttons and use only custom buttons
  customFooterContent = null, // Custom footer content to replace default buttons
  confirmOnEnter = true, // When true, Enter triggers Next (or Complete on last step)
  confirmOnCtrlEnter = true, // When true, Ctrl/Cmd+Enter triggers Complete on any step
  enterAction = 'complete-on-last', // 'next' | 'complete-on-last'
  ignoreSelectors = 'textarea,[contenteditable]', // Ignore plain Enter when typing in these
  trapFocus = true, // When true, keep tab focus within the modal
}) {
  // Reference to the step content area for focus management
  const stepContentRef = useRef(null);
  const modalRootRef = useRef(null);

  // Do not early-return before hooks; instead render null later to keep hook order stable

  // Enhanced step change handler with focus management
  const handleStepChange = (newStep) => {
    try {
      const logger = globalThis.NightingaleLogger?.get('nav:stepper');
      logger?.info('Step change', { from: currentStep, to: newStep, title });
    } catch (_) {
      /* ignore */
    }
    onStepChange(newStep);

    // Focus management for step change
    if (globalThis.NightingaleFocusManager && stepContentRef.current) {
      // Use a slight delay to ensure the step content has updated
      setTimeout(() => {
        globalThis.NightingaleFocusManager.focusStepChange(
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
      try {
        const logger = globalThis.NightingaleLogger?.get('nav:stepper');
        logger?.debug('Next clicked', {
          from: currentStep,
          to: currentStep + 1,
          title,
        });
      } catch (_) {
        /* ignore */
      }
      handleStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      try {
        const logger = globalThis.NightingaleLogger?.get('nav:stepper');
        logger?.debug('Back clicked', {
          from: currentStep,
          to: currentStep - 1,
          title,
        });
      } catch (_) {
        /* ignore */
      }
      handleStepChange(currentStep - 1);
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  const handleComplete = () => {
    try {
      const logger = globalThis.NightingaleLogger?.get('nav:stepper');
      logger?.info('Complete triggered', { step: currentStep, title });
    } catch (_) {
      /* ignore */
    }
    onComplete?.();
  };

  const shouldIgnorePlainEnter = (target) => {
    // Always ignore contenteditable or textarea unless Ctrl/Cmd is pressed
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'textarea' || target.isContentEditable) return true;
    // Additional selectors
    try {
      if (
        ignoreSelectors &&
        target.closest &&
        target.closest(ignoreSelectors)
      ) {
        return true;
      }
    } catch (_) {
      // Ignore selector parsing errors and fall back to basic checks
    }
    return false;
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key !== 'Enter') return;
    if (e.isComposing) return;

    // Ctrl/Cmd + Enter -> Complete (if enabled)
    if (confirmOnCtrlEnter && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isCompleteDisabled) handleComplete();
      return;
    }

    // Plain Enter handling (if enabled)
    if (!confirmOnEnter) return;
    if (shouldIgnorePlainEnter(e.target)) return;

    e.preventDefault();
    if (enterAction === 'next') {
      handleNext();
    } else {
      // complete-on-last
      if (isLastStep) {
        if (!isCompleteDisabled) handleComplete();
      } else {
        handleNext();
      }
    }
  };

  // Focus trap implementation (lightweight, no external deps)
  const handleFocusTrap = useCallback(
    (e) => {
      if (!trapFocus || !isOpen) return;
      if (e.key !== 'Tab') return;
      const root = modalRootRef.current;
      if (!root) return;
      // Collect focusable elements inside modal
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[role="button"]',
        '[tabindex]:not([tabindex="-1"])',
      ];
      const focusable = Array.from(
        root.querySelectorAll(focusableSelectors.join(',')),
      ).filter(
        (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [trapFocus, isOpen],
  );

  useEffect(() => {
    if (!isOpen || !trapFocus) return;
    const previouslyFocused = document.activeElement;
    // Try focusing first interactive element on open
    const root = modalRootRef.current;
    if (root) {
      const focusTarget = root.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusTarget?.focus();
    }
    const keyListener = (e) => handleFocusTrap(e);
    window.addEventListener('keydown', keyListener, true);
    return () => {
      window.removeEventListener('keydown', keyListener, true);
      if (previouslyFocused && previouslyFocused.focus) {
        try {
          previouslyFocused.focus();
        } catch (_) {
          /* ignore */
        }
      }
    };
  }, [isOpen, trapFocus, handleFocusTrap]);

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
          onClick={isLastStep ? handleComplete : handleNext}
          disabled={isLastStep ? isCompleteDisabled : false}
          className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLastStep
              ? 'bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLastStep ? completeButtonText : 'Next'}
        </button>
      </div>
    ) : null);

  // Resolve Modal from UI registry without window fallback
  const Modal =
    getComponent('ui', 'Modal') ||
    (({ isOpen, onClose, title, size, children, footerContent }) =>
      isOpen ? (
        <div
          data-testid="modal"
          className="fixed inset-0 flex"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          <div className="relative m-auto bg-white rounded p-4 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2
                data-testid="modal-title"
                className="text-lg font-semibold"
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {/* Test hook to surface size prop for unit tests */}
            {size && (
              <div
                data-testid="modal-size"
                className="hidden"
              >
                {size}
              </div>
            )}
            <div>{children}</div>
            {footerContent && <div className="mt-4">{footerContent}</div>}
          </div>
        </div>
      ) : null);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
      footerContent={footerContent}
    >
      <div
        ref={modalRootRef}
        className="flex space-x-8"
        onKeyDown={handleKeyDown}
        aria-modal="true"
        role="dialog"
        aria-label={title}
      >
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
                      try {
                        const logger =
                          globalThis.NightingaleLogger?.get('nav:stepper');
                        logger?.debug('Step clicked', {
                          from: currentStep,
                          to: index,
                          title,
                        });
                      } catch (_) {
                        /* ignore */
                      }
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
  completeButtonText: PropTypes.string,
  isCompleteDisabled: PropTypes.bool,
  hideNavigation: PropTypes.bool,
  customFooterContent: PropTypes.node,
  confirmOnEnter: PropTypes.bool,
  confirmOnCtrlEnter: PropTypes.bool,
  enterAction: PropTypes.oneOf(['next', 'complete-on-last']),
  ignoreSelectors: PropTypes.string,
  trapFocus: PropTypes.bool,
};

// Register with UI registry
registerComponent('ui', 'StepperModal', StepperModal);

export default StepperModal;
