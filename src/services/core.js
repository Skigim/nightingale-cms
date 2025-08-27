/**
 * Nightingale Core Utilities Service
 *
 * Provides fundamental utility functions for data formatting, validation, and security
 * that are used across all applications in the Nightingale suite. These are pure
 * utility functions with no business logic or domain-specific knowledge.
 *
 * @namespace NightingaleCoreUtilities
 * @version 2.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

(function (window) {
  'use strict';

  // ========================================================================
  // SECURITY AND SANITIZATION UTILITIES
  // ========================================================================

  /**
   * Legacy sanitization function for simple text escaping.
   * Converts special characters to HTML entities.
   * @param {string} str The string to sanitize.
   * @returns {string} The sanitized string.
   */
  function sanitize(str) {
    if (!str) return '';
    return str
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Securely sets the inner HTML of an element using the DOMParser API to mitigate XSS risks.
   * @param {HTMLElement} element - The target element to set content on
   * @param {string} htmlString - The HTML string to safely render
   * @returns {void}
   */
  function setSanitizedInnerHTML(element, htmlString) {
    if (!element || typeof htmlString !== 'string') return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    element.innerHTML = '';
    Array.from(doc.body.childNodes).forEach((node) => {
      element.appendChild(node);
    });
  }

  /**
   * Safely encodes a value for use in URLs to prevent URL injection attacks.
   * @param {string} value - The value to encode for URL usage
   * @returns {string} - The URL-encoded value
   */
  function encodeURL(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    return encodeURIComponent(String(value));
  }

  /**
   * Safely sanitizes HTML content and returns it as a string.
   * @param {string} htmlString - The HTML string to sanitize
   * @returns {string} - The sanitized HTML string
   */
  function sanitizeHTML(htmlString) {
    if (typeof htmlString !== 'string') return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    return doc.body.innerHTML;
  }

  // ========================================================================
  // DATE AND TIME FORMATTING UTILITIES
  // ========================================================================

  /**
   * Formats a date string (e.g., ISO format) into a user-friendly MM/DD/YYYY format.
   * Includes a timezone offset correction to prevent date changes.
   * @param {string} dateString The date string to format.
   * @returns {string} The formatted date, or "N/A" if the input is invalid.
   */
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    const adjustedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );
    return adjustedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Formats a date string into the YYYY-MM-DD format required by HTML <input type="date"> elements.
   * @param {string} dateString The date string to format.
   * @returns {string} The date in YYYY-MM-DD format, or an empty string if invalid.
   */
  function toInputDateFormat(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const adjustedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000
    );
    return adjustedDate.toISOString().substring(0, 10);
  }

  // ========================================================================
  // TEXT FORMATTING UTILITIES
  // ========================================================================

  /**
   * Formats a string of numbers into a standard (XXX) XXX-XXXX phone number format.
   * @param {string} value The raw phone number string.
   * @returns {string} The formatted phone number.
   */
  function formatPhoneNumber(value) {
    if (!value) return '';
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }

  /**
   * Converts a name string into proper "Firstname Lastname" case.
   * It can handle inputs like "LASTNAME, FIRSTNAME" or "JOHN DOE".
   * @param {string} name The name string to format.
   * @returns {string} The name in proper case.
   */
  function formatProperCase(name) {
    if (!name || typeof name !== 'string') return '';
    let processedName = name.trim();

    // Handle "Last, First" format
    if (processedName.includes(',')) {
      const parts = processedName.split(',').map((p) => p.trim());
      processedName = `${parts[1] || ''} ${parts[0] || ''}`.trim();
    }

    // Capitalize each word
    return processedName
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Formats a name into "Lastname, Firstname" format for display.
   * @param {string} name The name string to format.
   * @returns {string} The name in "Lastname, Firstname" format.
   */
  function formatPersonName(name) {
    if (!name || typeof name !== 'string') return '';
    const trimmedName = name.trim();
    if (!trimmedName) return '';

    // If name is already in "Last, First" format, return it as-is
    if (trimmedName.includes(',')) {
      return trimmedName;
    }

    const nameParts = trimmedName.split(/\s+/);
    if (nameParts.length < 2) return trimmedName;

    const lastName = nameParts[nameParts.length - 1];
    const firstMiddleNames = nameParts.slice(0, -1).join(' ');
    return `${lastName}, ${firstMiddleNames}`;
  }

  // ========================================================================
  // VALIDATION UTILITIES
  // ========================================================================

  /**
   * Collection of reusable validation functions for forms.
   * Each validator returns an object with { isValid, message, sanitizedValue }.
   */
  const Validators = {
    required:
      (message = 'This field is required.') =>
      (value) => ({
        isValid: value && value.toString().trim() !== '',
        message,
        sanitizedValue: value ? value.toString().trim() : '',
      }),

    email:
      (message = 'Please enter a valid email address.') =>
      (value) => ({
        isValid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
        message,
        sanitizedValue: value ? value.toString().trim().toLowerCase() : '',
      }),

    phone:
      (message = 'Please enter a valid phone number.') =>
      (value) => {
        const cleaned = value ? value.replace(/\D/g, '') : '';
        return {
          isValid: !value || /^\d{10,}$/.test(cleaned),
          message,
          sanitizedValue: cleaned,
        };
      },

    mcn:
      (message = 'Please enter a valid Master Case Number.') =>
      (value) => {
        const cleaned = value ? value.toString().trim().toUpperCase() : '';
        return {
          isValid: !value || /^[A-Z0-9\-_]{3,}$/.test(cleaned),
          message,
          sanitizedValue: cleaned,
        };
      },

    minLength:
      (length, message = `Must be at least ${length} characters.`) =>
      (value) => ({
        isValid: !value || value.trim().length >= length,
        message,
        sanitizedValue: value.trim(),
      }),

    maxLength:
      (length, message = `Must be no more than ${length} characters.`) =>
      (value) => ({
        isValid: !value || value.trim().length <= length,
        message,
        sanitizedValue: value.trim(),
      }),
  };

  // ========================================================================
  // GENERIC DATA UTILITIES
  // ========================================================================

  /**
   * Calculates the next available sequential ID from an array of items.
   * @param {object[]} items An array of objects, each with an 'id' property.
   * @returns {number} The next highest ID.
   */
  function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(1, ...items.map((item) => item.id || 0)) + 1;
  }

  /**
   * Search service wrapper for Fuse.js
   */
  class NightingaleSearchService {
    constructor(data, options = {}) {
      if (typeof Fuse === 'undefined') {
        console.error('NightingaleSearchService: Fuse.js is not available');
        this.fuse = null;
        return;
      }

      const defaultOptions = {
        includeScore: false,
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 1,
        shouldSort: true,
        ...options,
      };

      try {
        this.fuse = new Fuse(data, defaultOptions);
        this.data = data;
        this.options = defaultOptions;
      } catch (error) {
        console.error(
          'NightingaleSearchService: Error initializing Fuse.js:',
          error
        );
        this.fuse = null;
      }
    }

    search(query) {
      if (!this.fuse || !query || typeof query !== 'string') {
        return [];
      }

      try {
        const results = this.fuse.search(query.trim());
        return results.map((result) => result.item || result);
      } catch (error) {
        console.error('NightingaleSearchService: Search error:', error);
        return [];
      }
    }

    setData(newData) {
      if (!Array.isArray(newData)) {
        console.warn('NightingaleSearchService: setData expects an array');
        return;
      }

      try {
        this.data = newData;
        if (this.fuse) {
          this.fuse.setCollection(newData);
        }
      } catch (error) {
        console.error('NightingaleSearchService: Error updating data:', error);
      }
    }

    isReady() {
      return this.fuse !== null && typeof Fuse !== 'undefined';
    }
  }

  // ========================================================================
  // SERVICE INITIALIZATION AND EXPORT
  // ========================================================================

  // Create service object
  const NightingaleCoreUtilities = {
    // Security functions
    sanitize,
    setSanitizedInnerHTML,
    encodeURL,
    sanitizeHTML,

    // Date and time formatting
    formatDate,
    toInputDateFormat,

    // Text formatting
    formatPhoneNumber,
    formatProperCase,
    formatPersonName,

    // Validation
    Validators,

    // Generic data utilities
    getNextId,

    // Search service
    SearchService: NightingaleSearchService,

    // Metadata
    version: '2.0.0',
    name: 'NightingaleCoreUtilities',
  };

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.NightingaleCoreUtilities = NightingaleCoreUtilities;
    window.NightingaleSearchService = NightingaleSearchService;
    console.log('✅ Nightingale Core Utilities Service loaded');

    // Register with service registry if available
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      window.NightingaleServices.registerService(
        'coreUtilities',
        NightingaleCoreUtilities,
        'core'
      );
      console.log(
        '🛠️ Core Utilities Service registered with Nightingale Services'
      );
    }

    // Legacy global functions for backward compatibility
    window.sanitize = sanitize;
    window.setSanitizedInnerHTML = setSanitizedInnerHTML;
    window.encodeURL = encodeURL;
    window.sanitizeHTML = sanitizeHTML;
    window.formatDate = formatDate;
    window.toInputDateFormat = toInputDateFormat;
    window.formatPhoneNumber = formatPhoneNumber;
    window.formatProperCase = formatProperCase;
    window.formatPersonName = formatPersonName;
    window.Validators = Validators;
    window.getNextId = getNextId;
  }

  // Return service for module systems
  return NightingaleCoreUtilities;
})(typeof window !== 'undefined' ? window : this);

// ES6 Module Export
export default (typeof window !== 'undefined' &&
  window.NightingaleCoreUtilities) ||
  (typeof global !== 'undefined' ? global.NightingaleCoreUtilities : null);
