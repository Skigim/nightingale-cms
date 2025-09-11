import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * Sidebar.js - Navigation sidebar UI component
 *
 * Generic UI component for application navigation with tab switching and settings access.
 * Provides a compact sidebar with icons, tooltips, and special states.
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

/**
 * Sidebar Component
 * Displays a vertical navigation sidebar with tabs and settings button
 *
 * @param {Object} props - Component props
 * @param {string} props.activeTab - ID of the currently active tab
 * @param {Function} props.onTabChange - Callback when a tab is selected
 * @param {Function} [props.onSettingsClick] - Callback when settings button is clicked
 * @param {string} [props.caseViewMode] - Current view mode for cases (e.g., 'details')
 * @param {Function} [props.onCaseBackToList] - Callback to navigate back to cases list
 * @returns {React.Element} Sidebar component
 */
function Sidebar({
  activeTab,
  onTabChange,
  onSettingsClick,
  onReportBugClick,
  caseViewMode,
  onCaseBackToList,
}) {
  // Validate required props
  if (!activeTab || typeof onTabChange !== 'function') {
    return null;
  }

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
    },
    {
      id: 'cases',
      label: 'Cases',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'people',
      label: 'People',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      id: 'organizations',
      label: 'Organizations',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      id: 'eligibility',
      label: 'Eligibility',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const renderTabButton = (tab) => {
    // Special handling for Cases tab when in details view
    if (
      tab.id === 'cases' &&
      activeTab === 'cases' &&
      caseViewMode === 'details'
    ) {
      return (
        <button
          key={tab.id}
          onClick={() => onCaseBackToList && onCaseBackToList()}
          className="w-full p-3 rounded-md transition-all duration-200 group relative bg-blue-600 text-white"
          title="Back to Cases List"
        >
          <svg
            className="w-5 h-5 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Back to Cases List
          </div>
        </button>
      );
    }

    // Regular tab rendering
    return (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`w-full p-3 rounded-md transition-all duration-200 group relative ${
          activeTab === tab.id
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
        title={tab.label}
      >
        <svg
          className="w-5 h-5 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={tab.icon}
          />
        </svg>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {tab.label}
        </div>
      </button>
    );
  };

  return (
    <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-blue-400 font-bold text-sm text-center">CMS</h1>
      </div>

      <nav className="flex-1 p-2 space-y-2">{tabs.map(renderTabButton)}</nav>

      {/* Report Bug button (above settings) */}
      {onReportBugClick && (
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={onReportBugClick}
            className="w-full p-3 rounded-md text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 transition-all duration-200 group relative"
            title="Report a Bug"
          >
            <svg
              className="w-5 h-5 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5 13a7 7 0 1114 0A7 7 0 015 13z"
              />
            </svg>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Report a Bug
            </div>
          </button>
        </div>
      )}

      {/* Settings button */}
      {onSettingsClick && (
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={onSettingsClick}
            className="w-full p-3 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200 group relative"
            title="Settings"
          >
            <svg
              className="w-5 h-5 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

Sidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onSettingsClick: PropTypes.func,
  onReportBugClick: PropTypes.func,
  caseViewMode: PropTypes.string,
  onCaseBackToList: PropTypes.func,
};

// Register component
registerComponent('ui', 'Sidebar', Sidebar);

export default Sidebar;
