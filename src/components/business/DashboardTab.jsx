/**
 * Nightingale CMS - Dashboard Tab Component (JSX Refactor)
 * Provides summary statistics and quick actions.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

function DashboardTab({ fullData }) {
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

  const statCards = [
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
  ];

  const quickActions = [
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
  ];

  const handleQuickAction = (qa) => {
    if (qa.action === 'createCase') {
      window.NightingaleToast?.showInfoToast?.('Case creation coming soon!');
    } else if (qa.action === 'searchCases') {
      window.location.hash = '#cases';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <h2 className="text-3xl font-bold text-blue-300 mb-2">
          Welcome to Nightingale CMS
        </h2>
        <p className="text-gray-400 text-lg">
          Case Management System - Cases &amp; Eligibility Focus
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`bg-${stat.color}-500/20 p-3 rounded-lg`}>
                <svg
                  className={`w-6 h-6 text-${stat.color}-400`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              className="text-left p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={() => handleQuickAction(qa)}
            >
              <h4 className="font-medium text-white mb-1">{qa.label}</h4>
              <p className="text-sm text-gray-400">{qa.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

DashboardTab.propTypes = {
  fullData: PropTypes.object,
};

registerComponent('business', 'DashboardTab', DashboardTab);

export default DashboardTab;
