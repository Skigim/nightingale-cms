import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * Nightingale Component Library - Cards
 * Layer: UI (Generic)
 *
 * A generic card component for displaying information in card layouts.
 * Framework-agnostic, reusable presentation component with no business logic.
 */

/**
 * Individual Card Component
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
  ...otherProps
}) {
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
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size] || sizeClasses.md,
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

  return (
    <div
      {...otherProps}
      className={cardClasses}
      onClick={cardProps.onClick}
      onKeyDown={cardProps.onKeyDown}
      tabIndex={cardProps.tabIndex}
      role={cardProps.role}
    >
      {/* Card Header */}
      {(title || subtitle || headerActions) && (
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            )}
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-2 ml-4">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {/* Card Content */}
      {children && <div className="text-gray-300">{children}</div>}
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'minimal']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  interactive: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  headerActions: PropTypes.node,
  status: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
};

/**
 * Card Grid Component
 */
function CardGrid({
  children,
  columns = 'auto',
  gap = 'md',
  className = '',
  ...otherProps
}) {
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
    gapClasses[gap] || gapClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={gridClasses}
      {...otherProps}
    >
      {children}
    </div>
  );
}

CardGrid.propTypes = {
  children: PropTypes.node,
  columns: PropTypes.oneOfType([
    PropTypes.oneOf([1, 2, 3, 4, 'auto']),
    PropTypes.number,
    PropTypes.string,
  ]),
  gap: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

/**
 * Card List Component (stacked layout)
 */
function CardList({ children, gap = 'md', className = '', ...otherProps }) {
  // Gap classes for stacked layout
  const gapClasses = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  const listClasses = [gapClasses[gap] || gapClasses.md, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={listClasses}
      {...otherProps}
    >
      {children}
    </div>
  );
}

CardList.propTypes = {
  children: PropTypes.node,
  gap: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

/**
 * Card Field - displays a label/value pair
 */
function CardField({ label, value, className = '' }) {
  if (!value && value !== 0) return null;

  return (
    <div className={`mb-2 ${className}`}>
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-white mt-1">{value}</dd>
    </div>
  );
}

CardField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
  ]),
  className: PropTypes.string,
};

/**
 * Card Actions - action buttons in card footer
 */
function CardActions({
  children,
  align = 'right',
  className = '',
  ...otherProps
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      className={`flex items-center mt-4 pt-3 border-t border-gray-700 ${
        alignClasses[align] || alignClasses.right
      } ${className}`}
      {...otherProps}
    >
      {children}
    </div>
  );
}

CardActions.propTypes = {
  children: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center', 'right', 'between']),
  className: PropTypes.string,
};

// Export individual components
const Cards = {
  Card,
  CardGrid,
  CardList,
  CardField,
  CardActions,
};

// Register with the UI component system
registerComponent('ui', 'Card', Card);
registerComponent('ui', 'CardGrid', CardGrid);
registerComponent('ui', 'CardList', CardList);
registerComponent('ui', 'CardField', CardField);
registerComponent('ui', 'CardActions', CardActions);
registerComponent('ui', 'Cards', Cards);

export default Cards;
export { Card, CardGrid, CardList, CardField, CardActions };
