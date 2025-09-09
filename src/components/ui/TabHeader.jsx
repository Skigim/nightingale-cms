import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * TabHeader - Reusable header component for tab interfaces
 *
 * Provides a standardized header layout with icon, title, count, and actions.
 * Part of the Nightingale UI Layer - generic and framework-agnostic.
 *
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} props.count - Count or subtitle text
 * @param {Object} props.icon - Icon configuration object
 * @param {string} props.icon.d - SVG path data for the icon
 * @param {React.ReactNode} props.actions - Action buttons or elements
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.iconProps] - Additional props for the icon SVG
 * @returns {React.ReactElement} TabHeader component
 */
function TabHeader({
  title,
  count,
  icon,
  actions,
  className = '',
  iconProps = {},
}) {
  // Validate required props
  if (!title) {
    return null;
  }

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between ${className}`}
    >
      {/* Left side: Icon and title section */}
      <div className="flex items-center space-x-4">
        {/* Icon (if provided) */}
        {icon && (
          <svg
            className="w-8 h-8 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            {...iconProps}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={icon.d}
            />
          </svg>
        )}
        {/* Title and count section */}
        <div className="flex flex-col">
          <span className="font-bold text-white text-lg">{title}</span>
          {count && <span className="text-sm text-gray-400">{count}</span>}
        </div>
      </div>
      {/* Right side: Actions section */}
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
}

// PropTypes for validation
TabHeader.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.string,
  icon: PropTypes.shape({
    d: PropTypes.string.isRequired,
  }),
  actions: PropTypes.node,
  className: PropTypes.string,
  iconProps: PropTypes.object,
};

// Export for both module and script loading
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabHeader;
}

// ES6 export for modern module systems
export default TabHeader;

// Global registration for script loading
// Register with UI registry (legacy global removal)
registerComponent('ui', 'TabHeader', TabHeader);
