import { registerComponent } from '../../services/core';
/**
 * Stepper.js - Step indicator UI component
 *
 * Generic UI component for displaying step-by-step progress with interactive navigation.
 * Provides visual progress indication and clickable step navigation.
 *
 * @namespace NightingaleUI
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * Stepper Component
 * Displays a horizontal step progress indicator with optional progress bar
 *
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of step objects with title and optional description
 * @param {number} props.currentStep - Index of the currently active step
 * @param {Function} [props.onStepClick] - Callback when a step is clicked
 * @param {boolean} [props.allowBackward=true] - Allow clicking on previous steps
 * @param {boolean} [props.showProgress=true] - Show progress bar above steps
 * @param {Function} [props.isClickable] - Custom function to determine if step is clickable
 * @returns {React.Element} Stepper component
 */
function Stepper({
  steps,
  currentStep,
  onStepClick,
  allowBackward = true,
  showProgress = true,
  isClickable: customIsClickable,
}) {
  // React safety check
  if (!window.React) {
    return null;
  }

  const e = window.React.createElement;

  // Validate required props
  if (!steps || !Array.isArray(steps)) {
    return null;
  }

  if (typeof currentStep !== 'number') {
    return null;
  }

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 text-green-100 border-green-600';
      case 'active':
        return 'bg-blue-600 text-blue-100 border-blue-600';
      case 'pending':
        return 'bg-gray-600 text-gray-400 border-gray-600';
      default:
        return 'bg-gray-600 text-gray-400 border-gray-600';
    }
  };

  const isClickable = (stepIndex) => {
    if (customIsClickable) {
      return onStepClick && customIsClickable(stepIndex);
    }
    return onStepClick && (allowBackward || stepIndex <= currentStep);
  };

  return e(
    'div',
    { className: 'w-full' },

    // Progress bar (optional)
    showProgress &&
      e(
        'div',
        { className: 'mb-8' },
        e(
          'div',
          { className: 'flex items-center justify-between mb-2' },
          e('span', { className: 'text-sm text-gray-400' }, 'Progress'),
          e(
            'span',
            { className: 'text-sm text-gray-400' },
            `${Math.round(((currentStep + 1) / steps.length) * 100)}%`,
          ),
        ),
        e(
          'div',
          { className: 'w-full bg-gray-700 rounded-full h-2' },
          e('div', {
            className:
              'bg-blue-600 h-2 rounded-full transition-all duration-300',
            style: {
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            },
          }),
        ),
      ),

    // Steps
    e(
      'div',
      { className: 'flex items-center justify-between' },
      steps.map((step, index) => {
        const status = getStepStatus(index);
        const clickable = isClickable(index);

        return e(
          window.React.Fragment,
          { key: index },

          // Step container
          e(
            'div',
            { className: 'flex flex-col items-center relative' },

            // Step circle
            e(
              clickable ? 'button' : 'div',
              {
                className: `relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium text-sm transition-all duration-200 ${getStepColor(
                  status,
                )} ${clickable ? 'hover:scale-105 cursor-pointer' : ''}`,
                onClick: clickable ? () => onStepClick(index) : undefined,
                disabled: !clickable,
              },
              status === 'completed'
                ? e(
                    'svg',
                    {
                      className: 'w-5 h-5',
                      fill: 'none',
                      viewBox: '0 0 24 24',
                      stroke: 'currentColor',
                    },
                    e('path', {
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                      strokeWidth: 2,
                      d: 'M5 13l4 4L19 7',
                    }),
                  )
                : e('span', null, index + 1),
            ),

            // Step label
            e(
              'div',
              { className: 'mt-3 text-center' },
              e(
                'div',
                {
                  className: `text-sm font-medium ${
                    status === 'active'
                      ? 'text-blue-400'
                      : status === 'completed'
                        ? 'text-green-400'
                        : 'text-gray-400'
                  }`,
                },
                step.title,
              ),
              step.description &&
                e(
                  'div',
                  { className: 'text-xs text-gray-500 mt-1' },
                  step.description,
                ),
            ),
          ),
        );
      }),
    ),
  );
}

// PropTypes for validation
if (typeof window !== 'undefined' && window.PropTypes) {
  Stepper.propTypes = {
    steps: window.PropTypes.arrayOf(
      window.PropTypes.shape({
        title: window.PropTypes.string.isRequired,
        description: window.PropTypes.string,
      }),
    ).isRequired,
    currentStep: window.PropTypes.number.isRequired,
    onStepClick: window.PropTypes.func,
    allowBackward: window.PropTypes.bool,
    showProgress: window.PropTypes.bool,
    isClickable: window.PropTypes.func,
  };
}

// Default props
Stepper.defaultProps = {
  allowBackward: true,
  showProgress: true,
};

// Self-registration for both module and script loading
if (typeof window !== 'undefined') {
  // Register globally for backward compatibility
  window.Stepper = Stepper;

  // Register with NightingaleUI registry if available
  // New registry (ESM)
  registerComponent('ui', 'Stepper', Stepper);
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Stepper;
}

// ES6 export for modern module systems
export default Stepper;
