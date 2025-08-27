/**
 * Nightingale Application Suite - Shared Search Service
 *
 * This service has been moved to nightingale.utils.js for better organization.
 * This file is kept for backward compatibility with existing applications.
 */

// The NightingaleSearchService is now available in nightingale.utils.js
// This file exists only for backward compatibility

// For ES6 modules, we export a placeholder that refers to the main search service
const SearchService = null; // Will be replaced when integrated with main utils

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchService;
}

// ES6 Module Export
export default SearchService;
