/**
 * Nightingale CMS - Dashboard Tab Component
 *
 * Provides the main dashboard interface showing system statistics
 * and quick actions. Migrated to ES module registry pattern.
 *
 * @param {Object} props.fullData - Complete application data for statistics calculation
 * @returns {React.Element} Dashboard tab component
 */
import { registerComponent } from '../../services/core';
function DashboardTab({ fullData }) {
  // Hooks and React-related variables must be declared at the top level.
  // All hooks must be called at the top level of the component.
  const { useMemo } = window.React || {};
  const e = window.React ? window.React.createElement : () => null;

  const stats = useMemo(() => {
    if (!fullData)
      return {
        totalCases: 0,
        totalVrRequests: 0,
        activeCases: 0,
        pendingVr: 0,
      };

    const activeCases =
      fullData.cases?.filter(
        (c) => c.status !== 'Closed' && c.status !== 'Denied',
      ).length || 0;
    const pendingVr =
      fullData.vrRequests?.filter((vr) => vr.status === 'Pending').length || 0;

    return {
      totalCases: fullData.cases?.length || 0,
      totalVrRequests: fullData.vrRequests?.length || 0,
      activeCases,
      pendingVr,
    };
  }, [fullData]);

  // Note: Hash navigation is handled by user actions, no automatic side effects needed
  // Hash changes are triggered by user interactions (e.g., clicking quick actions)

  if (!window.React) {
    // If React is not available, the component cannot render.
    return null;
  }

  return e(
    'div',
    { className: 'w-full space-y-4' },
    e(
      'div',
      { className: 'w-full' },
      e(
        'h2',
        { className: 'text-3xl font-bold text-blue-300 mb-2' },
        'Welcome to Nightingale CMS',
      ),
      e(
        'p',
        { className: 'text-gray-400 text-lg' },
        'Case Management System - Cases & Eligibility Focus',
      ),
    ),
    e(
      'div',
      {
        className:
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full',
      },
      [
        {
          label: 'Total Cases',
          value: stats.totalCases,
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          color: 'blue',
        },
        {
          label: 'Active Cases',
          value: stats.activeCases,
          icon: 'M13 10V3L4 14h7v7l9-11h-7z',
          color: 'green',
        },
        {
          label: 'VR Requests',
          value: stats.totalVrRequests,
          icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          color: 'orange',
        },
        {
          label: 'Pending VRs',
          value: stats.pendingVr,
          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          color: 'yellow',
        },
      ].map((stat, index) =>
        e(
          'div',
          {
            key: index,
            className: 'bg-gray-800 rounded-lg p-6 border border-gray-700',
          },
          e(
            'div',
            { className: 'flex items-center justify-between' },
            e(
              'div',
              null,
              e(
                'p',
                { className: 'text-gray-400 text-sm font-medium' },
                stat.label,
              ),
              e(
                'p',
                { className: 'text-3xl font-bold text-white' },
                stat.value,
              ),
            ),
            e(
              'div',
              { className: `bg-${stat.color}-500/20 p-3 rounded-lg` },
              e(
                'svg',
                {
                  className: `w-6 h-6 text-${stat.color}-400`,
                  fill: 'none',
                  viewBox: '0 0 24 24',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                e('path', {
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  d: stat.icon,
                }),
              ),
            ),
          ),
        ),
      ),
    ),
    e(
      'div',
      { className: 'bg-gray-800 rounded-lg p-6 border border-gray-700' },
      e(
        'h3',
        { className: 'text-lg font-semibold text-white mb-4' },
        'Quick Actions',
      ),
      e(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        [
          {
            label: 'Create New Case',
            description: 'Start a new case workflow',
            action: 'createCase',
          },
          {
            label: 'Search Cases',
            description: 'Find and manage existing cases',
            action: 'searchCases',
          },
        ].map((action, index) =>
          e(
            'button',
            {
              key: index,
              className:
                'text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors',
              onClick: () => {
                if (action.action === 'createCase') {
                  // Will implement case creation modal
                  if (
                    window.NightingaleToast &&
                    window.NightingaleToast.showInfoToast
                  ) {
                    window.NightingaleToast.showInfoToast(
                      'Case creation coming soon!',
                    );
                  }
                } else if (action.action === 'searchCases') {
                  // Switch to cases tab
                  window.location.hash = '#cases';
                }
              },
            },
            e('h4', { className: 'font-medium text-white mb-1' }, action.label),
            e('p', { className: 'text-sm text-gray-400' }, action.description),
          ),
        ),
      ),
    ),
  );
}

// PropTypes validation
DashboardTab.propTypes = {
  fullData: window.PropTypes?.object,
};

// Register with business component system
if (typeof window !== 'undefined') {
  window.DashboardTab = DashboardTab; // legacy global
  registerComponent('business', 'DashboardTab', DashboardTab);
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardTab;
}

// ES6 Module Export
export default DashboardTab;
