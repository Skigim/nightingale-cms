// App/js/components/ui/TabHeader.js
import { registerComponent } from '../../services/core';
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
  const e = window.React.createElement;

  // Validate required props
  if (!title) {
    return null;
  }

  return e(
    'div',
    {
      className: `bg-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between ${className}`,
    },
    // Left side: Icon and title section
    e(
      'div',
      { className: 'flex items-center space-x-4' },
      // Icon (if provided)
      icon &&
        e(
          'svg',
          {
            className: 'w-8 h-8 text-blue-400',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24',
            xmlns: 'http://www.w3.org/2000/svg',
            ...iconProps,
          },
          e('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: icon.d,
          }),
        ),
      // Title and count section
      e(
        'div',
        { className: 'flex flex-col' },
        e('span', { className: 'font-bold text-white text-lg' }, title),
        count && e('span', { className: 'text-sm text-gray-400' }, count),
      ),
    ),
    // Right side: Actions section
    actions && e('div', { className: 'flex items-center space-x-2' }, actions),
  );
}

// PropTypes for development validation
if (typeof window !== 'undefined' && window.PropTypes) {
  TabHeader.propTypes = {
    title: window.PropTypes.string.isRequired,
    count: window.PropTypes.string,
    icon: window.PropTypes.shape({
      d: window.PropTypes.string.isRequired,
    }),
    actions: window.PropTypes.node,
    className: window.PropTypes.string,
    iconProps: window.PropTypes.object,
  };
}

// Export for both module and script loading
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabHeader;
}

// ES6 export for modern module systems
export default TabHeader;

// Global registration for script loading
if (typeof window !== 'undefined') {
  window.TabHeader = TabHeader;

  // Register with NightingaleUI if available
  // New registry (ESM)
  registerComponent('ui', 'TabHeader', TabHeader);
}
