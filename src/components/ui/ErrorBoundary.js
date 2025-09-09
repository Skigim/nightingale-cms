/**
 * ErrorBoundary.js - Error boundary UI component
 *
 * Class component for graceful error handling in React applications.
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.
 *
 * Note: This is a class component as Error Boundaries require class components in React.
 *
 * @namespace NightingaleUI
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * ErrorBoundary Component
 * Wraps components to catch and handle errors gracefully
 *
 * @class ErrorBoundary
 * @extends React.Component
 */
class ErrorBoundary extends window.React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // (logging removed) hook for future logger integration
  }

  render() {
    // React safety check (though this should always be available in class components)
    if (!window.React) {
      return null;
    }

    const e = window.React.createElement;

    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return e(
        'div',
        {
          className:
            'h-full w-full flex items-center justify-center bg-gray-900 text-white p-8',
        },
        e(
          'div',
          { className: 'max-w-2xl text-center' },
          e(
            'h1',
            { className: 'text-3xl font-bold mb-4' },
            'Something went wrong',
          ),
          e(
            'p',
            { className: 'text-gray-300 mb-6' },
            "The application encountered an error and couldn't recover.",
          ),
          e(
            'button',
            {
              className:
                'bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-medium',
              onClick: () => window.location.reload(),
            },
            'Reload Application',
          ),
          this.state.error &&
            e(
              'details',
              { className: 'mt-6 text-left' },
              e(
                'summary',
                { className: 'cursor-pointer text-gray-400' },
                'Technical Details',
              ),
              e(
                'pre',
                {
                  className:
                    'mt-2 text-sm bg-gray-800 p-4 rounded overflow-auto',
                },
                this.state.error.toString() +
                  '\n' +
                  (this.state.errorInfo?.componentStack || ''),
              ),
            ),
        ),
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

// PropTypes for validation
if (typeof window !== 'undefined' && window.PropTypes) {
  ErrorBoundary.propTypes = {
    children: window.PropTypes.node.isRequired,
  };
}

// Self-registration for both module and script loading
if (typeof window !== 'undefined') {
  // Register globally for backward compatibility
  window.ErrorBoundary = ErrorBoundary;

  // Register with NightingaleUI registry if available
  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent(
      'ErrorBoundary',
      ErrorBoundary,
      'core',
    );
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}

// ES6 Module Export
export default ErrorBoundary;
