/* eslint-disable react/prop-types */
/**
 * Nightingale Component Library - Badge System
 *
 * Status badges and indicators that integrate with Nightingale's consistent
 * color scheme and provide standardized visual feedback.
 */

/**
 * Status Badge Component
 * @param {Object} props - Component props
 * @param {string} props.status - The status value to display
 * @param {string} props.variant - Badge variant: 'status', 'priority', 'verification', 'case-type'
 * @param {string} props.size - Badge size: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.customColors - Custom color mapping override
 * @returns {React.Element} Badge component
 */
function Badge({
  status,
  variant = 'status',
  size = 'md',
  className = '',
  customColors = null,
}) {
  const e = window.React.createElement;

  if (!status) return null;

  // Color mappings for different badge types
  const colorMappings = {
    // Verification status colors (from Correspondence app)
    verification: {
      'Needs VR': 'bg-red-600 text-red-100',
      'Review Pending': 'bg-orange-500 text-orange-100',
      'AVS Pending': 'bg-blue-600 text-blue-100',
      'VR Pending': 'bg-yellow-600 text-yellow-100',
      Verified: 'bg-green-600 text-green-100',
    },

    // Case status colors
    status: {
      Active: 'bg-green-600 text-green-100',
      Pending: 'bg-yellow-600 text-yellow-100',
      Closed: 'bg-gray-600 text-gray-100',
      Denied: 'bg-red-600 text-red-100',
      'Under Review': 'bg-blue-600 text-blue-100',
      Approved: 'bg-green-600 text-green-100',
      Incomplete: 'bg-orange-600 text-orange-100',
    },

    // Priority levels
    priority: {
      High: 'bg-red-600 text-red-100',
      Medium: 'bg-yellow-600 text-yellow-100',
      Low: 'bg-green-600 text-green-100',
      Critical: 'bg-red-800 text-red-100',
      Normal: 'bg-gray-600 text-gray-100',
    },

    // Case types
    'case-type': {
      LTC: 'bg-blue-600 text-blue-100',
      SIMP: 'bg-purple-600 text-purple-100',
      QMB: 'bg-green-600 text-green-100',
      SLMB: 'bg-yellow-600 text-yellow-100',
      QI: 'bg-orange-600 text-orange-100',
    },

    // Application types
    application: {
      Application: 'bg-blue-600 text-blue-100',
      Renewal: 'bg-green-600 text-green-100',
      Review: 'bg-yellow-600 text-yellow-100',
      Appeal: 'bg-red-600 text-red-100',
    },
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  // Get colors for the status
  const colors = customColors || colorMappings[variant] || colorMappings.status;
  const colorClass = colors[status] || 'bg-gray-600 text-gray-100';

  // Build final className
  const finalClassName = `
    inline-flex items-center rounded-full font-medium
    ${sizeClasses[size]}
    ${colorClass}
    ${className}
  `
    .replace(/\s+/g, ' ')
    .trim();

  return e(
    'span',
    {
      className: finalClassName,
      title: status, // Tooltip for accessibility
    },
    status
  );
}

/**
 * Progress Badge Component - shows completion percentage
 * @param {Object} props - Component props
 * @param {number} props.current - Current progress value
 * @param {number} props.total - Total/max value
 * @param {string} props.label - Optional label to display
 * @param {string} props.size - Badge size: 'sm', 'md', 'lg'
 * @param {boolean} props.showPercentage - Whether to show percentage
 * @returns {React.Element} Progress badge
 */
function ProgressBadge({
  current = 0,
  total = 100,
  label = null,
  size = 'md',
  showPercentage = true,
}) {
  const e = window.React.createElement;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Color based on completion percentage
  let colorClass;
  if (percentage >= 100) {
    colorClass = 'bg-green-600 text-green-100';
  } else if (percentage >= 75) {
    colorClass = 'bg-blue-600 text-blue-100';
  } else if (percentage >= 50) {
    colorClass = 'bg-yellow-600 text-yellow-100';
  } else if (percentage > 0) {
    colorClass = 'bg-orange-600 text-orange-100';
  } else {
    colorClass = 'bg-gray-600 text-gray-100';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const displayText = label
    ? `${label}: ${showPercentage ? `${percentage}%` : `${current}/${total}`}`
    : showPercentage
      ? `${percentage}%`
      : `${current}/${total}`;

  return e(
    'span',
    {
      className: `
        inline-flex items-center rounded-full font-medium
        ${sizeClasses[size]}
        ${colorClass}
      `
        .replace(/\s+/g, ' ')
        .trim(),
      title: `${current} of ${total} complete (${percentage}%)`,
    },
    displayText
  );
}

/**
 * Count Badge Component - shows numeric counts (like notifications)
 * @param {Object} props - Component props
 * @param {number} props.count - Number to display
 * @param {string} props.variant - Color variant: 'default', 'primary', 'success', 'warning', 'danger'
 * @param {number} props.max - Maximum number to show before showing "max+"
 * @param {boolean} props.showZero - Whether to show the badge when count is 0
 * @returns {React.Element|null} Count badge or null if count is 0 and showZero is false
 */
function CountBadge({
  count = 0,
  variant = 'default',
  max = 99,
  showZero = false,
}) {
  const e = window.React.createElement;

  if (count === 0 && !showZero) return null;

  const colorClasses = {
    default: 'bg-gray-600 text-gray-100',
    primary: 'bg-blue-600 text-blue-100',
    success: 'bg-green-600 text-green-100',
    warning: 'bg-yellow-600 text-yellow-100',
    danger: 'bg-red-600 text-red-100',
  };

  const displayCount = count > max ? `${max}+` : count.toString();

  return e(
    'span',
    {
      className: `
        inline-flex items-center justify-center
        min-w-[1.25rem] h-5 px-1
        rounded-full text-xs font-medium
        ${colorClasses[variant]}
      `
        .replace(/\s+/g, ' ')
        .trim(),
      title: `${count} items`,
    },
    displayCount
  );
}

/**
 * Multi-Badge Component - displays multiple badges in a row
 * @param {Object} props - Component props
 * @param {Array} props.badges - Array of badge configurations
 * @param {string} props.spacing - Spacing between badges: 'tight', 'normal', 'loose'
 * @param {string} props.wrap - How to handle wrapping: 'wrap', 'nowrap', 'truncate'
 * @returns {React.Element} Multi-badge container
 */
function MultiBadge({ badges = [], spacing = 'normal', wrap = 'wrap' }) {
  const e = window.React.createElement;

  if (!badges.length) return null;

  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3',
  };

  const wrapClasses = {
    wrap: 'flex-wrap',
    nowrap: 'flex-nowrap',
    truncate: 'flex-nowrap overflow-hidden',
  };

  return e(
    'div',
    {
      className: `
        flex items-center
        ${spacingClasses[spacing]}
        ${wrapClasses[wrap]}
      `
        .replace(/\s+/g, ' ')
        .trim(),
    },
    badges.map((badgeProps, index) =>
      e(Badge, {
        key: badgeProps.key || index,
        ...badgeProps,
      })
    )
  );
}

// Export components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Badge,
    ProgressBadge,
    CountBadge,
    MultiBadge,
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.Badge = Badge;
  window.ProgressBadge = ProgressBadge;
  window.CountBadge = CountBadge;
  window.MultiBadge = MultiBadge;

  // For backward compatibility with existing StatusBadge usage
  window.StatusBadge = Badge;

  // Register with component system
  if (window.NightingaleComponentLibrary) {
    window.NightingaleComponentLibrary.registerComponent('Badge', Badge);
    window.NightingaleComponentLibrary.registerComponent('StatusBadge', Badge); // Alias
    window.NightingaleComponentLibrary.registerComponent(
      'ProgressBadge',
      ProgressBadge
    );
    window.NightingaleComponentLibrary.registerComponent(
      'CountBadge',
      CountBadge
    );
    window.NightingaleComponentLibrary.registerComponent(
      'MultiBadge',
      MultiBadge
    );
  }
}
