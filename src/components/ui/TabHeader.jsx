import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * TabHeader - Reusable header component for tab interfaces
 *
 * Provides a standardized header layout with icon, title, count, and actions.
 * Optionally supports tab navigation with keyboard accessibility.
 * Part of the Nightingale UI Layer - generic and framework-agnostic.
 *
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} props.count - Count or subtitle text
 * @param {Object} props.icon - Icon configuration object
 * @param {string} props.icon.d - SVG path data for the icon
 * @param {React.ReactNode} props.actions - Action buttons or elements
 * @param {Array} props.tabs - Array of tab objects for navigation
 * @param {Function} props.onTabChange - Callback when tab is changed
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.iconProps] - Additional props for the icon SVG
 * @returns {React.ReactElement} TabHeader component
 */
function TabHeader({
  title,
  count,
  icon,
  actions,
  tabs,
  onTabChange,
  className = '',
  iconProps = {},
}) {
  const handleTabClick = useCallback(
    (tabId) => {
      onTabChange?.(tabId);
    },
    [onTabChange],
  );

  const handleTabKeyDown = useCallback(
    (event, tabId, tabIndex) => {
      const { key } = event;

      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        onTabChange?.(tabId);
        return;
      }

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        event.preventDefault();
        const direction = key === 'ArrowLeft' ? -1 : 1;
        const nextIndex = (tabIndex + direction + tabs.length) % tabs.length;
        const nextTabButton = document.querySelector(
          `[data-tab-index="${nextIndex}"]`,
        );
        nextTabButton?.focus();
      }
    },
    [onTabChange, tabs],
  );

  // Validate required props (after hooks to keep them unconditional)
  if (!title) {
    return null;
  }

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 mb-6 flex flex-col space-y-4 ${className}`}
      role="banner"
    >
      {/* Header section */}
      <div className="flex items-center justify-between">
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
            <h2 className="font-bold text-white text-lg">{title}</h2>
            {count && <span className="text-sm text-gray-400">{count}</span>}
          </div>
        </div>
        {/* Right side: Actions section */}
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>

      {/* Tab navigation section */}
      {tabs && tabs.length > 0 && (
        <nav
          role="tablist"
          className="flex space-x-1 border-b border-gray-700"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              data-tab-index={index}
              aria-selected={tab.active}
              tabIndex={tab.active ? 0 : -1}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                tab.active
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id, index)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}
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
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      active: PropTypes.bool.isRequired,
    }),
  ),
  onTabChange: PropTypes.func,
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
