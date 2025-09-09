/* eslint-disable react/prop-types */
import { registerComponent } from '../../services/core';
/**
 * Nightingale Component Library - Cards
 * Layer: UI (Generic)
 *
 * A generic card component for displaying information in card layouts.
 * Framework-agnostic, reusable presentation component with no business logic.
 */

/**
 * Individual Card Component
 * @param {Object} props - Card properties
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.variant - Card style variant ('default', 'elevated', 'outlined', 'minimal')
 * @param {string} props.size - Card size ('sm', 'md', 'lg')
 * @param {boolean} props.interactive - Whether card responds to hover/focus
 * @param {function} props.onClick - Click handler for interactive cards
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.headerActions - Optional actions in card header
 * @param {string} props.status - Status indicator ('success', 'warning', 'error', 'info')
 */
function Card({
  title,
  subtitle,
  children,
  variant = 'default',
  size = 'md',
  interactive = false,
  onClick,
  className = '',
  headerActions,
  status,
}) {
  const e = window.React.createElement;

  // Base card classes
  const baseClasses = 'rounded-lg border transition-colors';

  // Variant styles
  const variantClasses = {
    default: 'bg-gray-800 border-gray-700',
    elevated: 'bg-gray-800 border-gray-700 shadow-lg',
    outlined: 'bg-transparent border-gray-600',
    minimal: 'bg-gray-900 border-gray-800',
  };

  // Size classes
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  // Interactive states
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
    : '';

  // Status indicator classes
  const statusClasses = status
    ? {
        success: 'border-l-4 border-l-green-500',
        warning: 'border-l-4 border-l-yellow-500',
        error: 'border-l-4 border-l-red-500',
        info: 'border-l-4 border-l-blue-500',
      }[status]
    : '';

  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    interactiveClasses,
    statusClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const cardProps = {
    className: cardClasses,
    ...(interactive &&
      onClick && {
        onClick,
        onKeyDown: (e) => e.key === 'Enter' && onClick(),
        tabIndex: 0,
        role: 'button',
      }),
  };

  return e(
    'div',
    cardProps,
    // Card Header
    (title || subtitle || headerActions) &&
      e(
        'div',
        { className: 'flex items-start justify-between mb-3' },
        e(
          'div',
          { className: 'flex-1' },
          title &&
            e(
              'h3',
              { className: 'text-lg font-semibold text-white mb-1' },
              title,
            ),
          subtitle && e('p', { className: 'text-sm text-gray-400' }, subtitle),
        ),
        headerActions &&
          e(
            'div',
            { className: 'flex items-center space-x-2 ml-4' },
            headerActions,
          ),
      ),
    // Card Content
    children && e('div', { className: 'text-gray-300' }, children),
  );
}

/**
 * Card Grid Component
 * @param {Object} props - Grid properties
 * @param {React.ReactNode} props.children - Card components
 * @param {number} props.columns - Number of columns (1-4)
 * @param {string} props.gap - Gap between cards ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 */
function CardGrid({ children, columns = 'auto', gap = 'md', className = '' }) {
  const e = window.React.createElement;

  // Grid column classes
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // Gap classes
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const gridClasses = [
    'grid',
    columnClasses[columns] || columnClasses.auto,
    gapClasses[gap],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return e('div', { className: gridClasses }, children);
}

/**
 * Card List Component (stacked layout)
 * @param {Object} props - List properties
 * @param {React.ReactNode} props.children - Card components
 * @param {string} props.gap - Gap between cards ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 */
function CardList({ children, gap = 'md', className = '' }) {
  const e = window.React.createElement;

  // Gap classes for stacked layout
  const gapClasses = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  const listClasses = [gapClasses[gap], className].filter(Boolean).join(' ');

  return e('div', { className: listClasses }, children);
}

/**
 * Card Content Helpers
 */

/**
 * Card Field - displays a label/value pair
 */
function CardField({ label, value, className = '' }) {
  const e = window.React.createElement;

  if (!value && value !== 0) return null;

  return e(
    'div',
    { className: `mb-2 ${className}` },
    e('dt', { className: 'text-sm font-medium text-gray-400' }, label),
    e('dd', { className: 'text-sm text-white mt-1' }, value),
  );
}

/**
 * Card Actions - action buttons in card footer
 */
function CardActions({ children, align = 'right', className = '' }) {
  const e = window.React.createElement;

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return e(
    'div',
    {
      className: `flex items-center mt-4 pt-3 border-t border-gray-700 ${alignClasses[align]} ${className}`,
    },
    children,
  );
}

// Export individual components
const Cards = {
  Card,
  CardGrid,
  CardList,
  CardField,
  CardActions,
};

// Register with the UI component system
// Register with UI registry (legacy global removal)
registerComponent('ui', 'Card', Card);
registerComponent('ui', 'CardGrid', CardGrid);
registerComponent('ui', 'CardList', CardList);
registerComponent('ui', 'CardField', CardField);
registerComponent('ui', 'CardActions', CardActions);
registerComponent('ui', 'Cards', Cards);

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Card,
    CardGrid,
    CardList,
    CardField,
    CardActions,
    Cards,
  };
}

// ES6 export for modern module systems
export default Cards;
export { Card, CardGrid, CardList, CardField, CardActions };
