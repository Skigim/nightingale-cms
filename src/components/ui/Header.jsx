import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * Header.js - Application header UI component
 *
 * Generic UI component for application header with status indicators, save controls, and settings access.
 * Provides file connection status, autosave status, and manual save functionality.
 *
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
function Header({
  fileStatus = 'disconnected',
  autosaveStatus,
  onSettingsClick,
  onManualSave,
}) {
  // Local fallback button (no global window fallback)
  const PrimaryButton = function FallbackButton({ children, onClick, title }) {
    return (
      <button
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        onClick={onClick}
        title={title}
      >
        {children}
      </button>
    );
  };

  PrimaryButton.propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
    title: PropTypes.string,
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
      case 'running':
      case 'connected':
        return { text: 'Auto', className: 'text-green-400', icon: '🔄' };
      case 'waiting':
        return { text: 'Waiting', className: 'text-yellow-300', icon: '…' };
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
    !autosaveStatus ||
    autosaveStatus.status === 'error' ||
    autosaveStatus.status === 'stopped' ||
    autosaveStatus.status === 'waiting';

  const getFileStatusText = () => {
    switch (fileStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnect':
        return 'Reconnect';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Connecting...';
    }
  };

  const getFileStatusTitle = () => {
    switch (fileStatus) {
      case 'connected':
        return 'Click to open settings and change save folder';
      case 'reconnect':
        return 'Click to reconnect folder access (permission needed)';
      case 'disconnected':
        return 'Click to open settings and connect to save folder';
      default:
        return 'Click to open settings';
    }
  };

  const getFileStatusClasses = () => {
    const baseClasses =
      'px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1';
    switch (fileStatus) {
      case 'connected':
        return `${baseClasses} bg-green-600 text-green-100 hover:bg-green-500 cursor-pointer`;
      case 'reconnect':
        return `${baseClasses} bg-yellow-600 text-yellow-100 hover:bg-yellow-500 cursor-pointer`;
      case 'disconnected':
        return `${baseClasses} bg-red-600 text-red-100 hover:bg-red-500 cursor-pointer`;
      default:
        return `${baseClasses} bg-yellow-600 text-yellow-100 hover:bg-yellow-500 cursor-pointer`;
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-800 p-2 shadow-md flex-shrink-0">
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mr-2 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="font-bold text-white">Nightingale CMS - React</span>
      </div>

      <div className="flex items-center space-x-3">
        {/* File Status - Always clickable for settings access */}
        <div className="text-sm">
          <button
            className={getFileStatusClasses()}
            onClick={onSettingsClick}
            title={getFileStatusTitle()}
          >
            <span>{getFileStatusText()}</span>
            {/* Add settings icon to indicate it's always clickable */}
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* Autosave Status Display */}
        <div
          className="flex items-center space-x-1.5"
          title={autosaveStatus?.message || 'Autosave status'}
        >
          <span className="text-sm">{autosaveDisplay.icon}</span>
          <span className={`text-xs ${autosaveDisplay.className}`}>
            {autosaveDisplay.text}
          </span>
        </div>

        {/* Manual Save Button (only shown when autosave is not working) */}
        {showManualSave && onManualSave && (
          <PrimaryButton
            onClick={onManualSave}
            title="Manual save (autosave not available)"
          >
            Save
          </PrimaryButton>
        )}

        {/* Status lights (matching original CMS) */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="w-3 h-3 bg-green-400 rounded-full" />
          <div className="w-3 h-3 bg-red-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}

Header.propTypes = {
  fileStatus: PropTypes.oneOf([
    'connected',
    'reconnect',
    'disconnected',
    'connecting',
  ]),
  autosaveStatus: PropTypes.shape({
    status: PropTypes.string,
    message: PropTypes.string,
  }),
  onSettingsClick: PropTypes.func,
  onManualSave: PropTypes.func,
};

// Register component
registerComponent('ui', 'Header', Header);

export default Header;
