/**
 * Nightingale Clipboard Service
 *
 * Provides modern clipboard operations with automatic fallback and user feedback.
 * Consolidates clipboard functionality from utils and cmsutilities services.
 *
 * @namespace NightingaleClipboard
 * @version 2.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

(function (window) {
  'use strict';

  /**
   * Modern clipboard operations with user feedback
   */
  class NightingaleClipboard {
    /**
     * Copies text to the clipboard using the modern Clipboard API with fallback
     * @param {string} text - The text to copy to clipboard
     * @param {Object} options - Configuration options
     * @param {string} options.successMessage - Custom success message for toast
     * @param {string} options.errorMessage - Custom error message for toast
     * @param {boolean} options.showToast - Whether to show toast notification (default: true)
     * @param {number} options.debounceMs - Debounce duration in milliseconds (default: 300)
     * @returns {Promise<boolean>} Promise that resolves to true if successful
     */
    static async copyText(text, options = {}) {
      const config = {
        successMessage: 'Copied to clipboard!',
        errorMessage: 'Failed to copy to clipboard',
        showToast: true,
        debounceMs: 300,
        ...options,
      };

      // Validate input
      if (!text || typeof text !== 'string') {
        if (config.showToast && window.showToast) {
          window.showToast('Nothing to copy', 'error');
        }
        return false;
      }

      // Sanitize the text to copy
      const sanitizedText = text.trim();
      if (!sanitizedText) {
        if (config.showToast && window.showToast) {
          window.showToast('Nothing to copy', 'error');
        }
        return false;
      }

      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(sanitizedText);

          if (config.showToast && window.showToast) {
            window.showToast(config.successMessage, 'success');
          }
          return true;
        }

        // Fallback to execCommand for older browsers
        return this._fallbackCopy(sanitizedText, config);
      } catch (error) {
        console.warn('Clipboard API failed, trying fallback:', error);
        return this._fallbackCopy(sanitizedText, config);
      }
    }

    /**
     * Fallback copy method using document.execCommand
     * @private
     * @param {string} text - The text to copy
     * @param {Object} config - Configuration options
     * @returns {boolean} True if successful
     */
    static _fallbackCopy(text, config) {
      try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';

        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
          if (config.showToast && window.showToast) {
            window.showToast(config.successMessage, 'success');
          }
          return true;
        } else {
          throw new Error('execCommand failed');
        }
      } catch (error) {
        console.error('Fallback copy failed:', error);
        if (config.showToast && window.showToast) {
          window.showToast(config.errorMessage, 'error');
        }
        return false;
      }
    }

    /**
     * Creates a debounced copy function to prevent rapid clicking
     * @param {number} debounceMs - Debounce duration in milliseconds
     * @returns {Function} Debounced copy function
     */
    static createDebouncedCopy(debounceMs = 300) {
      if (typeof _ !== 'undefined' && _.debounce) {
        return _.debounce(
          (text, options) => this.copyText(text, options),
          debounceMs
        );
      } else {
        // Simple debounce fallback if Lodash is not available
        let timeoutId;
        return (text, options) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(
            () => this.copyText(text, options),
            debounceMs
          );
        };
      }
    }

    /**
     * Copy MCN to clipboard - specialized method for case numbers
     * @param {string} mcn - MCN to copy
     * @param {Object} options - Copy options
     * @returns {Promise<boolean>} Promise that resolves to true if successful
     */
    static async copyMCN(mcn, options = {}) {
      if (!mcn) {
        return this.copyText('', {
          ...options,
          errorMessage: 'No MCN to copy',
        });
      }

      return this.copyText(mcn, {
        successMessage: `MCN ${mcn} copied to clipboard`,
        ...options,
      });
    }

    /**
     * Copies formatted financial data with customizable templates
     * @param {Object} financialItem - The financial item object
     * @param {string} template - Template format ('full', 'summary', 'account')
     * @param {Object} options - Copy options
     * @returns {Promise<boolean>} Promise that resolves to true if successful
     */
    static async copyFinancialItem(
      financialItem,
      template = 'summary',
      options = {}
    ) {
      if (!financialItem) {
        return this.copyText('', {
          ...options,
          errorMessage: 'No financial item to copy',
        });
      }

      let textToCopy = '';

      switch (template) {
        case 'full':
          textToCopy = this._formatFinancialItemFull(financialItem);
          break;
        case 'account':
          textToCopy = this._formatFinancialItemAccount(financialItem);
          break;
        case 'summary':
        default:
          textToCopy = this._formatFinancialItemSummary(financialItem);
          break;
      }

      return this.copyText(textToCopy, {
        successMessage: 'Financial item copied!',
        ...options,
      });
    }

    /**
     * Formats financial item as summary text
     * @private
     * @param {Object} item - Financial item object
     * @returns {string} Formatted summary text
     */
    static _formatFinancialItemSummary(item) {
      const description = item.description || item.type || 'Financial Item';
      const amount = item.amount || item.value || 0;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return `${description}: ${formattedAmount}`;
    }

    /**
     * Formats financial item with account details
     * @private
     * @param {Object} item - Financial item object
     * @returns {string} Formatted account text
     */
    static _formatFinancialItemAccount(item) {
      const parts = [];

      if (item.description) parts.push(item.description);
      if (item.location) parts.push(`Institution: ${item.location}`);
      if (item.accountNumber) {
        const maskedAccount = this._maskAccountNumber(item.accountNumber);
        parts.push(`Account: ${maskedAccount}`);
      }

      const amount = item.amount || item.value || 0;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      parts.push(`Amount: ${formattedAmount}`);

      return parts.join('\n');
    }

    /**
     * Formats financial item with all available details
     * @private
     * @param {Object} item - Financial item object
     * @returns {string} Formatted full text
     */
    static _formatFinancialItemFull(item) {
      const parts = [];

      if (item.description) parts.push(`Description: ${item.description}`);
      if (item.type) parts.push(`Type: ${item.type}`);
      if (item.location) parts.push(`Institution: ${item.location}`);
      if (item.accountNumber) {
        const maskedAccount = this._maskAccountNumber(item.accountNumber);
        parts.push(`Account: ${maskedAccount}`);
      }

      const amount = item.amount || item.value || 0;
      const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      parts.push(`Amount: ${formattedAmount}`);

      if (item.frequency) parts.push(`Frequency: ${item.frequency}`);
      if (item.verificationStatus)
        parts.push(`Status: ${item.verificationStatus}`);

      return parts.join('\n');
    }

    /**
     * Masks account number showing only last 4 digits
     * @private
     * @param {string} accountNumber - Full account number
     * @returns {string} Masked account number
     */
    static _maskAccountNumber(accountNumber) {
      if (!accountNumber) return '';
      const digits = accountNumber.replace(/\D/g, '');
      if (digits.length <= 4) return digits;
      const masked = '*'.repeat(digits.length - 4);
      return masked + digits.slice(-4);
    }

    /**
     * Checks if clipboard functionality is available
     * @returns {boolean} True if clipboard is supported
     */
    static isSupported() {
      return !!(navigator.clipboard || document.execCommand);
    }
  }

  // Legacy function wrappers for backward compatibility
  function copyToClipboard(text, successMessage = null, errorMessage = null) {
    const options = {};
    if (successMessage) options.successMessage = successMessage;
    if (errorMessage) options.errorMessage = errorMessage;

    return NightingaleClipboard.copyText(text, options);
  }

  function copyMCN(mcn) {
    return NightingaleClipboard.copyMCN(mcn);
  }

  function fallbackCopyTextToClipboard(text, successMessage, errorMessage) {
    const options = {};
    if (successMessage) options.successMessage = successMessage;
    if (errorMessage) options.errorMessage = errorMessage;

    return NightingaleClipboard._fallbackCopy(text, options);
  }

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.NightingaleClipboard = NightingaleClipboard;
    console.log('✅ Nightingale Clipboard Service loaded');

    // Register with service registry if available
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      window.NightingaleServices.registerService(
        'clipboard',
        NightingaleClipboard,
        'core'
      );
      console.log('📋 Clipboard Service registered with Nightingale Services');
    }

    // Legacy global functions for backward compatibility
    window.copyToClipboard = copyToClipboard;
    window.copyMCN = copyMCN;
    window.fallbackCopyTextToClipboard = fallbackCopyTextToClipboard;
  }

  // Return service for module systems
  return NightingaleClipboard;
})(typeof window !== 'undefined' ? window : this);

// ES6 Module Export
export default (typeof window !== 'undefined' && window.NightingaleClipboard) ||
  null;
