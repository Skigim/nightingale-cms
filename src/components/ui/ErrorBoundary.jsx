import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * ErrorBoundary.jsx - Error boundary UI component
 *
 * Class component for graceful error handling in React applications.
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.
 *
 * Note: This is a class component as Error Boundaries require class components in React.
 *
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
class ErrorBoundary extends Component {
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

    // Log via Nightingale logger if available
    try {
      const logger = window.NightingaleLogger?.get('ErrorBoundary');
      logger?.error('Error caught by boundary:', error);
    } catch (logError) {
      // Silently handle logger errors
      console.error('Failed to log error:', logError);
    }
  }

  componentDidUpdate(prevProps) {
    // Reset error state when key prop changes
    // React does not pass 'key' through props; to allow manual resets, use a custom prop like 'boundaryKey'
    if (
      this.props.boundaryKey !== prevProps.boundaryKey &&
      this.state.hasError
    ) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white p-8">
          <div className="max-w-2xl text-center">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              The application encountered an error and couldn&apos;t recover.
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-medium"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-gray-400">
                  Technical Details
                </summary>
                <pre className="mt-2 text-sm bg-gray-800 p-4 rounded overflow-auto">
                  {this.state.error.toString() +
                    '\n' +
                    (this.state.errorInfo?.componentStack || '')}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

// PropTypes for validation
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  boundaryKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// Self-registration for both module and script loading
// Register with UI registry (legacy global removal)
registerComponent('ui', 'ErrorBoundary', ErrorBoundary);

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}

// ES6 Module Export
export default ErrorBoundary;
