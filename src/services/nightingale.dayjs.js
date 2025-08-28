/**
 * Nightingale Application Suite - Shared Day.js Utility Wrapper
 *
 * This file provides a standardized, globally accessible 'dateUtils' object
 * that wraps the Day.js library. This ensures consistent date and time
 * formatting and manipulation across all applications in the suite.
 */

// Prevent multiple declarations if script loads twice
if (typeof window !== 'undefined' && window.dateUtils) {
  // Already loaded, skip redefinition
} else {
  // The Day.js library and its plugins are expected to be loaded globally before this script.
  const dateUtils = {
    /**
     * Returns the current timestamp as an ISO 8601 string.
     * @returns {string} The current date and time in ISO format.
     */
    now: () => dayjs().toISOString(),

    /**
     * Formats a date string into a specified format.
     * @param {string} dateString - The date string to format.
     * @param {string} formatStr - The desired output format (e.g., "MM/DD/YYYY").
     * @returns {string} The formatted date string, or "N/A" if invalid.
     */
    format: (dateString, formatStr = 'MM/DD/YYYY') => {
      if (!dateString) return 'N/A';
      const date = dayjs(dateString);
      return date.isValid() ? date.format(formatStr) : 'N/A';
    },

    /**
     * Compares two dates for sorting. Returns -1 if A is before B, 1 if A is after B, 0 if equal.
     * Handles invalid dates gracefully.
     * @param {string} dateA - The first date string.
     * @param {string} dateB - The second date string.
     * @returns {number} The comparison result (-1, 0, or 1).
     */
    compareDates: (dateA, dateB) => {
      const d1 = dayjs(dateA);
      const d2 = dayjs(dateB);
      if (!d1.isValid() || !d2.isValid()) return 0;
      if (d1.isBefore(d2)) return -1;
      if (d1.isAfter(d2)) return 1;
      return 0;
    },

    /**
     * Checks if the first date is before the second date.
     * @param {string} dateToCheck The date to evaluate.
     * @param {string} dateToCompareAgainst The baseline date.
     * @returns {boolean}
     */
    isBefore: (dateToCheck, dateToCompareAgainst) => {
      const d1 = dayjs(dateToCheck);
      const d2 = dayjs(dateToCompareAgainst);
      return d1.isValid() && d2.isValid() ? d1.isBefore(d2) : false;
    },

    /**
     * Calculates a date that was a specified number of months ago from now.
     * @param {number} months The number of months to subtract.
     * @returns {string} The resulting date in ISO format.
     */
    monthsAgo: (months) => dayjs().subtract(months, 'month').toISOString(),

    /**
     * Adds a specified number of days to the current date.
     * @param {number} days The number of days to add.
     * @returns {string} The resulting date in ISO format.
     */
    addDays: (days) => dayjs().add(days, 'day').toISOString(),

    /**
     * Adds a specified number of days to a given date.
     * @param {string} dateString The base date string.
     * @param {number} days The number of days to add.
     * @returns {string} The resulting date in ISO format.
     */
    addDaysToDate: (dateString, days) => {
      const date = dayjs(dateString);
      return date.isValid() ? date.add(days, 'day').toISOString() : dateString;
    },

    /**
     * Formats the current date with a specific format.
     * @param {string} formatStr The desired output format (e.g., "M/D/YYYY", "YYYY-MM-DD").
     * @returns {string} The formatted current date.
     */
    formatToday: (formatStr = 'MM/DD/YYYY') => dayjs().format(formatStr),

    /**
     * Gets today's date in YYYY-MM-DD format for HTML date input elements.
     * @returns {string} Today's date in YYYY-MM-DD format.
     */
    todayForInput: () => dayjs().format('YYYY-MM-DD'),
  };

  // Make dateUtils available globally
  window.dateUtils = dateUtils;
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.dateUtils;
}

// ES6 Module Export
export default (typeof window !== 'undefined' && window.dateUtils) || null;
