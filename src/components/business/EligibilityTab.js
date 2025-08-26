/**
 * Nightingale CMS - Eligibility Tab Component
 *
 * Extracted from main CMS application (now in index.html) 
 * Simple placeholder tab for eligibility management functionality
 *
 * Features:
 * - Placeholder interface for future eligibility features
 * - Consistent styling with other tabs
 * - Ready for future enhancement
 *
 * @param {Object} props.fullData - Complete application data (currently unused)
 * @returns {React.Element} Eligibility tab component
 */
function EligibilityTab({ fullData }) {
  // Early return pattern for React safety
  if (!window.React) {
    return null;
  }

  const e = window.React.createElement;

  return e(
    'div',
    { className: 'space-y-6' },
    e('h2', { className: 'text-2xl font-bold text-white' }, 'Eligibility Management'),
    e(
      'div',
      { className: 'bg-gray-800 rounded-lg p-6 border border-gray-700' },
      e('p', { className: 'text-gray-400' }, 'Eligibility functionality will be implemented here...')
    )
  );
}

// PropTypes validation
EligibilityTab.propTypes = {
  fullData: window.PropTypes?.object,
};

// Register with the business component registry
if (typeof window !== 'undefined') {
  window.EligibilityTab = EligibilityTab;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'EligibilityTab',
      EligibilityTab,
      'eligibility',
      []
    );
  }

  // Legacy registration for backward compatibility
  if (typeof window.Nightingale !== 'undefined') {
    window.Nightingale.registerComponent('EligibilityTab', EligibilityTab);
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EligibilityTab;
}