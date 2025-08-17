/* eslint-disable react/prop-types */
/**
 * Nightingale Button Component
 *
 * A flexible, reusable button component with multiple variants, sizes, and states.
 * Integrates with the Nightingale design system and provides consistent styling
 * across all applications.
 */

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  fullWidth = false,
  ...props
}) {
  // Base button classes
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-gray-900',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
  ];

  // Variant styles
  const variants = {
    primary: [
      'bg-blue-600',
      'hover:bg-blue-700',
      'text-white',
      'border',
      'border-blue-600',
      'hover:border-blue-700',
      'focus:ring-blue-500',
      'shadow-sm',
    ],
    secondary: [
      'bg-gray-600',
      'hover:bg-gray-700',
      'text-white',
      'border',
      'border-gray-600',
      'hover:border-gray-700',
      'focus:ring-gray-500',
      'shadow-sm',
    ],
    success: [
      'bg-green-600',
      'hover:bg-green-700',
      'text-white',
      'border',
      'border-green-600',
      'hover:border-green-700',
      'focus:ring-green-500',
      'shadow-sm',
    ],
    danger: [
      'bg-red-600',
      'hover:bg-red-700',
      'text-white',
      'border',
      'border-red-600',
      'hover:border-red-700',
      'focus:ring-red-500',
      'shadow-sm',
    ],
    warning: [
      'bg-yellow-600',
      'hover:bg-yellow-700',
      'text-white',
      'border',
      'border-yellow-600',
      'hover:border-yellow-700',
      'focus:ring-yellow-500',
      'shadow-sm',
    ],
    outline: [
      'bg-transparent',
      'hover:bg-gray-700',
      'text-gray-300',
      'hover:text-white',
      'border',
      'border-gray-600',
      'hover:border-gray-500',
      'focus:ring-gray-500',
    ],
    ghost: [
      'bg-transparent',
      'hover:bg-gray-800',
      'text-gray-300',
      'hover:text-white',
      'border',
      'border-transparent',
      'focus:ring-gray-500',
    ],
    link: [
      'bg-transparent',
      'hover:bg-transparent',
      'text-blue-400',
      'hover:text-blue-300',
      'border',
      'border-transparent',
      'focus:ring-blue-500',
      'underline-offset-4',
      'hover:underline',
    ],
  };

  // Size styles
  const sizes = {
    xs: ['px-2', 'py-1', 'text-xs', 'gap-1'],
    sm: ['px-3', 'py-1.5', 'text-sm', 'gap-1.5'],
    md: ['px-4', 'py-2', 'text-sm', 'gap-2'],
    lg: ['px-6', 'py-3', 'text-base', 'gap-2'],
    xl: ['px-8', 'py-4', 'text-lg', 'gap-3'],
  };

  // Loading spinner component
  const LoadingSpinner = () =>
    window.React.createElement(
      'svg',
      {
        className: 'animate-spin -ml-1 mr-2 h-4 w-4',
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        viewBox: '0 0 24 24',
      },
      window.React.createElement('circle', {
        className: 'opacity-25',
        cx: '12',
        cy: '12',
        r: '10',
        stroke: 'currentColor',
        strokeWidth: '4',
      }),
      window.React.createElement('path', {
        className: 'opacity-75',
        fill: 'currentColor',
        d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
      })
    );

  // Icon component wrapper
  const IconWrapper = ({ children: iconChildren }) => {
    if (!iconChildren) return null;

    const iconSizeClasses = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6',
    };

    // If it's a string, try to look it up in ButtonIcons first
    let resolvedIcon = iconChildren;
    if (typeof iconChildren === 'string') {
      resolvedIcon = ButtonIcons[iconChildren] || iconChildren;
    }

    // If it's an SVG path string, create the SVG element
    if (typeof resolvedIcon === 'string') {
      return window.React.createElement(
        'svg',
        {
          className: iconSizeClasses[size],
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        window.React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: resolvedIcon,
        })
      );
    }

    // If it's already a React element, just return it with proper sizing
    return React.cloneElement(resolvedIcon, {
      className: `${iconSizeClasses[size]} ${resolvedIcon.props?.className || ''}`,
    });
  };

  // Build the final className
  const buttonClasses = [
    ...baseClasses,
    ...(variants[variant] || variants.primary),
    ...(sizes[size] || sizes.md),
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Handle click events
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return window.React.createElement(
    'button',
    {
      type,
      className: buttonClasses,
      onClick: handleClick,
      disabled: disabled || loading,
      ...props,
    },
    // Loading state
    loading && window.React.createElement(LoadingSpinner),

    // Icon (left side)
    iconPosition === 'left' &&
      !loading &&
      window.React.createElement(
        IconWrapper,
        {
          position: 'left',
        },
        icon
      ),

    // Button text/children
    children,

    // Icon (right side)
    iconPosition === 'right' &&
      !loading &&
      window.React.createElement(
        IconWrapper,
        {
          position: 'right',
        },
        icon
      )
  );
}

// Convenience button variants as separate components
function PrimaryButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'primary' });
}

function SecondaryButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'secondary' });
}

function DangerButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'danger' });
}

function SuccessButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'success' });
}

function OutlineButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'outline' });
}

function GhostButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'ghost' });
}

function LinkButton(props) {
  return window.React.createElement(Button, { ...props, variant: 'link' });
}

// Icon constants for common use cases
const ButtonIcons = {
  // Common actions
  save: 'M5 13l4 4L19 7',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  delete:
    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  add: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  view: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  close: 'M6 18L18 6M6 6l12 12',
  check: 'M5 13l4 4L19 7',

  // Navigation
  back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
  forward: 'M14 5l7 7m0 0l-7 7m7-7H3',
  up: 'M7 14l5-5 5 5',
  down: 'M19 14l-7 7m0 0l-7-7m7 7V3',

  // File operations
  download:
    'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  upload:
    'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',

  // Settings and info
  settings:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning:
    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.742-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z',
};

// Make available globally
if (typeof window !== 'undefined') {
  window.Button = Button;
  window.PrimaryButton = PrimaryButton;
  window.SecondaryButton = SecondaryButton;
  window.DangerButton = DangerButton;
  window.SuccessButton = SuccessButton;
  window.OutlineButton = OutlineButton;
  window.GhostButton = GhostButton;
  window.LinkButton = LinkButton;
  window.ButtonIcons = ButtonIcons;

  // Register with component system
  if (window.NightingaleComponentLibrary) {
    window.NightingaleComponentLibrary.registerComponent('Button', Button);
    window.NightingaleComponentLibrary.registerComponent(
      'PrimaryButton',
      PrimaryButton
    );
    window.NightingaleComponentLibrary.registerComponent(
      'SecondaryButton',
      SecondaryButton
    );
    window.NightingaleComponentLibrary.registerComponent(
      'DangerButton',
      DangerButton
    );
    window.NightingaleComponentLibrary.registerComponent(
      'SuccessButton',
      SuccessButton
    );
    window.NightingaleComponentLibrary.registerComponent(
      'OutlineButton',
      OutlineButton
    );
    window.NightingaleComponentLibrary.registerComponent(
      'GhostButton',
      GhostButton
    );
    window.NightingaleComponentLibrary.registerComponent(
      'LinkButton',
      LinkButton
    );
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Button,
    PrimaryButton,
    SecondaryButton,
    DangerButton,
    SuccessButton,
    OutlineButton,
    GhostButton,
    LinkButton,
    ButtonIcons,
  };
}
