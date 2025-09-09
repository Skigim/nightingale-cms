import { registerComponent } from '../../services/core';
/**
 * TabBase.js - Factory for creating standardized business-layer Tab components
 *
 * This factory enforces the OrganizationsTab architectural pattern across all Tab components:
 * 1. Unconditional React hooks (safety compliance)
 * 2. Early return pattern for loading/error states
 * 3. Multi-tier component registry fallbacks
 * 4. Standardized data handling and error boundaries
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * Fallback Modal component for when registry components are unavailable
 * Provides graceful degradation with basic modal functionality
 */
function FallbackModal({ isOpen, onClose, title, children }) {
  const e = window.React.createElement;

  if (!isOpen) return null;

  return e(
    'div',
    {
      className: 'fixed inset-0 z-50 flex items-center justify-center',
      onClick: onClose,
    },
    e('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50',
    }),
    e(
      'div',
      {
        className:
          'relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6',
        onClick: (e) => e.stopPropagation(),
      },
      e(
        'div',
        { className: 'flex justify-between items-center mb-4' },
        e('h2', { className: 'text-lg font-semibold' }, title),
        e(
          'button',
          {
            onClick: onClose,
            className: 'text-gray-400 hover:text-gray-600',
          },
          '×',
        ),
      ),
      e('div', null, children),
    ),
  );
}

// PropTypes for FallbackModal
FallbackModal.propTypes = {
  isOpen: window.PropTypes?.bool,
  onClose: window.PropTypes?.func,
  title: window.PropTypes?.string,
  children: window.PropTypes?.node,
};

/**
 * Fallback Button component for when registry components are unavailable
 * Provides basic button functionality with Tailwind styling
 */
function FallbackButton({
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  disabled,
  className = '',
}) {
  const e = window.React.createElement;

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary:
      'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return e(
    'button',
    {
      className:
        `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${disabledClasses} ${className}`.trim(),
      onClick: disabled ? undefined : onClick,
      disabled,
    },
    children,
  );
}

// PropTypes for FallbackButton
FallbackButton.propTypes = {
  variant: window.PropTypes?.oneOf([
    'primary',
    'secondary',
    'success',
    'danger',
  ]),
  size: window.PropTypes?.oneOf(['sm', 'md', 'lg']),
  onClick: window.PropTypes?.func,
  children: window.PropTypes?.node,
  disabled: window.PropTypes?.bool,
  className: window.PropTypes?.string,
};

/**
 * Fallback SearchBar component for when registry components are unavailable
 * Provides basic search input functionality
 */
function FallbackSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  const e = window.React.createElement;

  return e('input', {
    type: 'text',
    value: value || '',
    onChange: (e) => onChange && onChange(e.target.value),
    placeholder,
    className:
      `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`.trim(),
  });
}

// PropTypes for FallbackSearchBar
FallbackSearchBar.propTypes = {
  value: window.PropTypes?.string,
  onChange: window.PropTypes?.func,
  placeholder: window.PropTypes?.string,
  className: window.PropTypes?.string,
};

/**
 * Fallback TabHeader component for when registry components are unavailable
 * Provides basic header functionality
 */
function FallbackTabHeader({ title, count, icon, actions, className = '' }) {
  const e = window.React.createElement;

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
      // Simple icon fallback
      icon &&
        e(
          'div',
          {
            className:
              'w-8 h-8 bg-blue-400 rounded text-white flex items-center justify-center text-xs font-bold',
          },
          title.charAt(0).toUpperCase(),
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

// PropTypes for FallbackTabHeader
FallbackTabHeader.propTypes = {
  title: window.PropTypes?.string.isRequired,
  count: window.PropTypes?.string,
  icon: window.PropTypes?.object,
  actions: window.PropTypes?.node,
  className: window.PropTypes?.string,
};

/**
 * Multi-tier component registry access with comprehensive fallbacks
 * Implements the standardized lookup pattern used across all Tab components
 *
 * @param {string} componentName - Name of the component to retrieve
 * @param {Object} fallbackComponent - Fallback component if registry lookup fails
 * @returns {Function} React component function
 */
function getRegistryComponent(componentName, fallbackComponent) {
  if (window[componentName]) return window[componentName];
  // If an explicit null is passed, treat as "no fallback" and return null
  if (fallbackComponent === null) return null;
  if (fallbackComponent !== undefined) return fallbackComponent;
  // Only emit a visible error component when no explicit null/override provided
  return function ComponentNotFound() {
    const e = window.React.createElement;
    return e(
      'div',
      { className: 'p-4 bg-red-50 border border-red-200 rounded text-red-700' },
      `Component "${componentName}" not found in registry`,
    );
  };
}

/**
 * Standardized Search Section Component
 * Provides consistent Card-wrapped search bar for all tabs
 */
function SearchSection({ searchBar, className = '' }) {
  const e = window.React.createElement;
  const Card = getRegistryComponent('Card', null);

  if (Card) {
    return e(Card, {
      variant: 'elevated',
      className: `bg-gray-800 border-gray-700 ${className}`,
      children: searchBar,
    });
  }

  // Fallback to div wrapper
  return e(
    'div',
    {
      className: `bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`,
    },
    searchBar,
  );
}

/**
 * Standardized Content Section Component
 * Provides consistent Card-wrapped content areas for all tabs
 */
function ContentSection({ children, variant = 'table', className = '' }) {
  const e = window.React.createElement;
  const Card = getRegistryComponent('Card', null);

  const variantClasses = {
    table: 'bg-gray-900 border-gray-700', // Dark theme for data tables
    form: 'bg-white border-gray-200', // Light theme for forms
    info: 'bg-gray-50 border-gray-300', // Light gray for info sections
  };

  const variantClass = variantClasses[variant] || variantClasses.table;

  if (Card) {
    return e(Card, {
      variant: 'default',
      className: `${variantClass} ${className}`,
      children,
    });
  }

  // Fallback to div wrapper
  return e(
    'div',
    {
      className: `rounded-lg shadow ${variantClass} ${className}`,
    },
    children,
  );
}

// PropTypes for layout components
if (typeof window !== 'undefined' && window.PropTypes) {
  SearchSection.propTypes = {
    searchBar: window.PropTypes.node.isRequired,
    className: window.PropTypes.string,
  };

  ContentSection.propTypes = {
    children: window.PropTypes.node.isRequired,
    variant: window.PropTypes.oneOf(['table', 'form', 'info']),
    className: window.PropTypes.string,
  };
}

/**
 * Standardized component registry resolver
 * Provides all commonly used components with multi-tier fallbacks
 *
 * @returns {Object} Object containing resolved component references
 */
function resolveComponents() {
  return {
    Modal: getRegistryComponent('Modal', FallbackModal),
    ConfirmationModal: getRegistryComponent('ConfirmationModal', null),
    Button: getRegistryComponent('Button', FallbackButton),
    SearchBar: getRegistryComponent('SearchBar', FallbackSearchBar),
    TabHeader: getRegistryComponent('TabHeader', FallbackTabHeader),
    DataTable: getRegistryComponent('DataTable', null),
    Badge: getRegistryComponent('Badge', null),
    // Card Components
    Card: getRegistryComponent('Card', null),
    // Layout Helpers
    SearchSection,
    ContentSection,
    // Form Components
    FormField: getRegistryComponent('FormField', null),
    TextInput: getRegistryComponent('TextInput', null),
    Select: getRegistryComponent('Select', null),
    DateInput: getRegistryComponent('DateInput', null),
    Textarea: getRegistryComponent('Textarea', null),
    Checkbox: getRegistryComponent('Checkbox', null),
    // Business Components
    PersonCreationModal: getRegistryComponent('PersonCreationModal', null),
    OrganizationModal: getRegistryComponent('OrganizationModal', null),
    NotesModal: getRegistryComponent('NotesModal', null),
  };
}

/**
 * Factory function for creating standardized business-layer Tab components
 *
 * Enforces the OrganizationsTab architectural pattern:
 * - Unconditional React hooks at the top
 * - Early returns after all hooks
 * - Standardized component registry access
 * - Consistent error handling and loading states
 * - Data validation and normalization
 *
 * @param {Object} config - Configuration object for the Tab component
 * @param {string} config.name - Component name for registry and debugging
 * @param {Function} config.useData - Custom hook for data fetching/management
 * @param {Function} config.renderContent - Function to render the main tab content
 * @param {Function} [config.renderActions] - Optional function to render action buttons
 * @param {Function} [config.renderModals] - Optional function to render modals
 * @param {Object} [config.defaultProps] - Default props for the component
 * @returns {Function} React functional component
 */
function createBusinessComponent(config) {
  const {
    name,
    useData,
    renderContent,
    renderActions,
    renderModals,
    defaultProps = {},
  } = config;

  if (!name) {
    throw new Error('createBusinessComponent requires a name');
  }

  if (!useData || typeof useData !== 'function') {
    throw new Error(
      `createBusinessComponent "${name}" requires a useData hook function`,
    );
  }

  if (!renderContent || typeof renderContent !== 'function') {
    throw new Error(
      `createBusinessComponent "${name}" requires a renderContent function`,
    );
  }

  function TabComponent(props = {}) {
    const e = window.React.createElement;

    // Merge default props with provided props
    const finalProps = { ...defaultProps, ...props };

    // PHASE 1: Unconditional React Hooks (Must be at the top)
    // This follows the Rules of React - all hooks must be called unconditionally
    const dataResult = useData(finalProps);

    // PHASE 2: Component Registry Resolution
    // Resolve all required components with multi-tier fallbacks
    const components = resolveComponents();

    // PHASE 3: Early Return Pattern
    // Handle loading and error states immediately after hooks
    if (dataResult.loading) {
      return e(
        'div',
        { className: 'flex items-center justify-center p-8' },
        e('div', { className: 'text-gray-600' }, 'Loading...'),
      );
    }

    if (dataResult.error) {
      return e(
        'div',
        {
          className: 'p-4 bg-red-50 border border-red-200 rounded text-red-700',
        },
        `Error in ${name}: ${dataResult.error.message || 'Unknown error'}`,
      );
    }

    // PHASE 4: Data Validation
    // Ensure data is in expected format
    const data = dataResult.data || [];
    if (!Array.isArray(data)) {
      // data validation failed; continuing with empty array semantics
    }

    // PHASE 5: Render Phase
    // Compose the final component structure
    try {
      return e(
        'div',
        { className: 'space-y-6' },

        // Render action buttons if provided
        renderActions &&
          renderActions({ components, data: dataResult, props: finalProps }),

        // Render main content
        renderContent({ components, data: dataResult, props: finalProps }),

        // Render modals if provided
        renderModals &&
          renderModals({ components, data: dataResult, props: finalProps }),
      );
    } catch (renderError) {
      const logger = window.NightingaleLogger?.get('ui:tabRender');
      logger?.error('Tab render failed', {
        error: renderError.message,
        tabName: name,
        stack: renderError.stack,
      });
      return e(
        'div',
        {
          className: 'p-4 bg-red-50 border border-red-200 rounded text-red-700',
        },
        `Render error in ${name}: ${renderError.message}`,
      );
    }
  }

  // Set component name for debugging
  TabComponent.displayName = name;

  return TabComponent;
}

/**
 * Register TabBase components with the UI registry
 * Provides global access for component composition
 */
if (typeof window !== 'undefined') {
  registerComponent('ui', 'SearchSection', SearchSection);
  registerComponent('ui', 'ContentSection', ContentSection);
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBusinessComponent,
    getRegistryComponent,
    resolveComponents,
    FallbackModal,
    FallbackButton,
    FallbackSearchBar,
  };
}

// ES6 export for modern module systems
export default createBusinessComponent;
export {
  createBusinessComponent,
  getRegistryComponent,
  resolveComponents,
  FallbackModal,
  FallbackButton,
  FallbackSearchBar,
  SearchSection,
  ContentSection,
};
