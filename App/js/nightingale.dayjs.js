/**
 * Nightingale Application Suite - Shared Day.js Utility Wrapper
 *
 * This file provides a standardized, globally accessible 'dateUtils' object
 * that wraps the Day.js library. This ensures consistent date and time
 * formatting and manipulation across all applications in the suite.
 */

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
  format: (dateString, formatStr = "MM/DD/YYYY") => {
    if (!dateString) return "N/A";
    const date = dayjs(dateString);
    return date.isValid() ? date.format(formatStr) : "N/A";
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
};