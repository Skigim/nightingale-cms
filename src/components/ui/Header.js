/**
 * Header.js - Application header UI component
 * 
 * Generic UI component for application header with status indicators, save controls, and settings access.
 * Provides file connection status, autosave status, and manual save functionality.
 * 
 * @namespace NightingaleUI
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * Header Component
 * Displays application header with branding, status indicators, and controls
 * 
 * @param {Object} props - Component props
 * @param {string} [props.fileStatus] - File connection status ('connected', 'disconnected', 'connecting')
 * @param {Object} [props.autosaveStatus] - Autosave status object with status and message
 * @param {Function} [props.onSettingsClick] - Callback when settings button is clicked
 * @param {Function} [props.onManualSave] - Callback when manual save button is clicked
 * @returns {React.Element} Header component
 */
function Header({ fileStatus, autosaveStatus, onSettingsClick, onManualSave }) {
  // React safety check
  if (!window.React) {
    console.warn('React not available for Header component');
    return null;
  }

  const e = window.React.createElement;

  // Get button components with fallback
  const PrimaryButton = window.PrimaryButton || window.Button || function FallbackButton({ children, onClick, title, size }) {
    return e(
      'button',
      {
        className: 'px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors',
        onClick,
        title,
      },
      children
    );
  };

  // Determine autosave display status
  const getAutosaveDisplay = () => {
    if (!autosaveStatus) {
      return { text: 'Manual', className: 'text-gray-400', icon: '⚙️' };
    }

    switch (autosaveStatus.status) {
      case 'saved':
      case 'no-changes':
        return { text: 'Saved', className: 'text-green-400', icon: '✓' };
      case 'saving':
        return { text: 'Saving...', className: 'text-blue-400', icon: '⏳' };
      case 'error':
        return { text: 'Error', className: 'text-red-400', icon: '⚠️' };
      case 'initialized':
      case 'started':
        return { text: 'Auto', className: 'text-green-400', icon: '🔄' };
      default:
        return { text: 'Manual', className: 'text-gray-400', icon: '⚙️' };
    }
  };

  const autosaveDisplay = getAutosaveDisplay();
  const showManualSave =
    !autosaveStatus || autosaveStatus.status === 'error' || autosaveStatus.status === 'stopped';

  return e(
    'div',
    {
      className: 'flex items-center justify-between bg-gray-800 p-2 shadow-md flex-shrink-0',
    },
    e(
      'div',
      { className: 'flex items-center' },
      e(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          className: 'h-6 w-6 mr-2 text-blue-400',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
        },
        e('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        })
      ),
      e('span', { className: 'font-bold text-white' }, 'Nightingale CMS - React')
    ),
    e(
      'div',
      { className: 'flex items-center space-x-3' },
      // File Status - Always clickable for settings access
      e(
        'div',
        { className: 'text-sm' },
        e(
          'button',
          {
            className: `px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${
              fileStatus === 'connected'
                ? 'bg-green-600 text-green-100 hover:bg-green-500 cursor-pointer'
                : fileStatus === 'disconnected'
                  ? 'bg-red-600 text-red-100 hover:bg-red-500 cursor-pointer'
                  : 'bg-yellow-600 text-yellow-100 hover:bg-yellow-500 cursor-pointer'
            }`,
            onClick: onSettingsClick,
            title:
              fileStatus === 'connected'
                ? 'Click to open settings and change save folder'
                : fileStatus === 'disconnected'
                  ? 'Click to open settings and connect to save folder'
                  : 'Click to open settings',
          },
          e(
            'span',
            null,
            fileStatus === 'connected'
              ? 'Connected'
              : fileStatus === 'disconnected'
                ? 'Disconnected'
                : 'Connecting...'
          ),
          // Add settings icon to indicate it's always clickable
          e(
            'svg',
            {
              className: 'w-3 h-3',
              fill: 'none',
              viewBox: '0 0 24 24',
              stroke: 'currentColor',
            },
            e('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z',
            }),
            e('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
            })
          )
        )
      ),
      // Autosave Status Display
      e(
        'div',
        {
          className: 'flex items-center space-x-1.5',
          title: autosaveStatus?.message || 'Autosave status',
        },
        e('span', { className: 'text-sm' }, autosaveDisplay.icon),
        e('span', { className: `text-xs ${autosaveDisplay.className}` }, autosaveDisplay.text)
      ),
      // Manual Save Button (only shown when autosave is not working)
      showManualSave &&
        onManualSave &&
        e(PrimaryButton, {
          children: 'Save',
          onClick: onManualSave,
          icon: window.ButtonIcons?.save,
          size: 'sm',
          title: 'Manual save (autosave not available)',
        }),
      // Status lights (matching original CMS)
      e(
        'div',
        { className: 'flex space-x-2' },
        e('div', { className: 'w-3 h-3 bg-yellow-400 rounded-full' }),
        e('div', { className: 'w-3 h-3 bg-green-400 rounded-full' }),
        e('div', { className: 'w-3 h-3 bg-red-400 rounded-full' })
      )
    )
  );
}

// PropTypes for validation
if (typeof window !== 'undefined' && window.PropTypes) {
  Header.propTypes = {
    fileStatus: window.PropTypes.oneOf(['connected', 'disconnected', 'connecting']),
    autosaveStatus: window.PropTypes.shape({
      status: window.PropTypes.string,
      message: window.PropTypes.string,
    }),
    onSettingsClick: window.PropTypes.func,
    onManualSave: window.PropTypes.func,
  };
}

// Self-registration for both module and script loading
if (typeof window !== 'undefined') {
  // Register globally for backward compatibility
  window.Header = Header;

  // Register with NightingaleUI registry if available
  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('Header', Header, 'layout');
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Header;
}