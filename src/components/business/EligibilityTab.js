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
 * @returns {React.Element} Eligibility tab component
 */
import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';
function EligibilityTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Eligibility Management</h2>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">
          Eligibility functionality will be implemented here...
        </p>
      </div>
    </div>
  );
}

// PropTypes validation
EligibilityTab.propTypes = {
  fullData: PropTypes.object,
};

// Register with the business component registry
// Register with business registry (legacy global removal)
registerComponent('business', 'EligibilityTab', EligibilityTab);

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EligibilityTab;
}

// ES6 Module Export
export default EligibilityTab;
