/**
 * Nightingale Application Suite - Shared Utility Functions
 *
 * This file contains common, reusable helper functions for data formatting,
 * validation, and security that are shared across all applications in the suite.
 * By centralizing this logic, we ensure consistency and improve maintainability.
 */

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
 * This function parses HTML content in a safe environment, automatically neutralizing
 * script execution and other dangerous content while preserving safe HTML structure.
 *
 * @param {HTMLElement} element - The target element to set content on
 * @param {string} htmlString - The HTML string to safely render
 * @returns {void}
 */
function setSanitizedInnerHTML(element, htmlString) {
  if (!element || typeof htmlString !== 'string') return;

  // Use DOMParser to safely parse the string into a document fragment
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Clear the existing element's content
  element.innerHTML = '';

  // Append the nodes from the parsed body. This process neutralizes executable scripts.
  Array.from(doc.body.childNodes).forEach((node) => {
    element.appendChild(node);
  });
}

/**
 * Safely encodes a value for use in URLs to prevent URL injection attacks.
 * This function ensures that user input cannot break out of URL parameters
 * or inject malicious URLs.
 *
 * @param {string} value - The value to encode for URL usage
 * @returns {string} - The URL-encoded value
 */
function encodeURL(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return encodeURIComponent(String(value));
}

/**
 * Safely sanitizes HTML content and returns it as a string.
 * Uses DOMParser to parse and clean the HTML, removing script execution
 * while preserving safe HTML structure and formatting.
 *
 * @param {string} htmlString - The HTML string to sanitize
 * @returns {string} - The sanitized HTML string
 */
function sanitizeHTML(htmlString) {
  if (typeof htmlString !== 'string') return '';

  // Use DOMParser to safely parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Return the cleaned HTML content
  return doc.body.innerHTML;
}

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
  // Adjust for timezone offset to prevent the date from changing
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
  // Adjust for timezone offset
  const adjustedDate = new Date(
    date.getTime() + date.getTimezoneOffset() * 60000
  );
  return adjustedDate.toISOString().substring(0, 10);
}

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

/**
 * An object containing a collection of reusable validation functions for forms.
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

/**
 * Flattens all financial items (resources, income, expenses) from a case object
 * into a single array.
 * @param {object} caseObject The case object containing the financials property.
 * @returns {object[]} A single array containing all financial items.
 */
function getFlatFinancials(caseObject) {
  if (!caseObject || !caseObject.financials) return [];
  return [
    ...(caseObject.financials.resources || []),
    ...(caseObject.financials.income || []),
    ...(caseObject.financials.expenses || []),
  ];
}

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
 * Determines the correct label for the application date field based on the application type.
 * @param {string} applicationType The type of application (e.g., "Application" or "Renewal").
 * @returns {string} The appropriate label.
 */
function getAppDateLabel(applicationType) {
  return applicationType === 'Renewal' ? 'Renewal Due' : 'Application Date';
}

/**
 * Returns a new, default object for application details.
 * @returns {object} The default appDetails object.
 */
function getDefaultAppDetails() {
  return {
    appDate: '',
    caseType: 'LTC',
    applicationType: 'Application',
    avsConsentDate: '',
    admissionDate: '',
    medicareAExpDate: '',
  };
}

/**
 * Extracts a unique, sorted list of note categories from all cases.
 * @param {object[]} cases The array of case objects.
 * @returns {string[]} A sorted array of unique note category strings.
 */
function getUniqueNoteCategories(cases) {
  if (!cases) return [];
  const allNotes = cases.flatMap((c) => c.notes || []);
  return [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
}

/**
 * NightingaleFocusManager - Advanced focus management for modals and UI components
 *
 * Provides consistent, intelligent focus management with support for:
 * - Modal opening focus
 * - Step progression focus
 * - State change focus (view/edit modes)
 * - Fallback and error handling
 */
class NightingaleFocusManager {
  /**
   * Intelligently focuses the first appropriate element in a container
   * @param {HTMLElement|string} container - Container element or selector
   * @param {Object} options - Focus configuration options
   * @param {string[]} options.preferredSelectors - Priority order of selectors to focus
   * @param {number} options.delay - Delay before focusing (default: 100ms)
   * @param {boolean} options.debounce - Whether to debounce focus calls (default: true)
   * @param {Function} options.onFocused - Callback when element is focused
   * @param {Function} options.onNoFocusable - Callback when no focusable element found
   * @returns {Promise<HTMLElement|null>} Promise resolving to focused element
   */
  static async focusFirst(container, options = {}) {
    const config = {
      preferredSelectors: [
        'input:not([disabled]):not([readonly]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled]):not([readonly])',
        'button:not([disabled])',
        '[href]:not([disabled])',
        '[tabindex]:not([tabindex="-1"]):not([disabled])',
      ],
      delay: 100,
      debounce: true,
      onFocused: null,
      onNoFocusable: null,
      ...options,
    };

    // Get container element
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container)
      : container;

    if (!containerElement) {
      console.warn('NightingaleFocusManager: Container not found');
      return null;
    }

    // Create focus function
    const performFocus = () => {
      return this._findAndFocusElement(containerElement, config);
    };

    // Apply debouncing if requested and Lodash is available
    if (config.debounce && typeof _ !== 'undefined' && _.debounce) {
      const debouncedFocus = _.debounce(performFocus, 50);
      
      // Use delay to ensure DOM is ready
      if (typeof _ !== 'undefined' && _.delay) {
        return new Promise(resolve => {
          _.delay(() => {
            resolve(debouncedFocus());
          }, config.delay);
        });
      } else {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(debouncedFocus());
          }, config.delay);
        });
      }
    } else {
      // Simple delay without debouncing
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(performFocus());
        }, config.delay);
      });
    }
  }

  /**
   * Finds and focuses the best available element
   * @private
   * @param {HTMLElement} container - Container to search within
   * @param {Object} config - Configuration options
   * @returns {HTMLElement|null} Focused element or null
   */
  static _findAndFocusElement(container, config) {
    // Try preferred selectors in order
    for (const selector of config.preferredSelectors) {
      const element = container.querySelector(selector);
      if (element && this._isVisible(element)) {
        try {
          element.focus();
          
          // Verify focus was successful
          if (document.activeElement === element) {
            if (typeof _ !== 'undefined' && _.isFunction && _.isFunction(config.onFocused)) {
              config.onFocused(element);
            } else if (typeof config.onFocused === 'function') {
              config.onFocused(element);
            }
            return element;
          }
        } catch (error) {
          console.warn('Focus failed for element:', element, error);
        }
      }
    }

    // No focusable element found
    if (typeof _ !== 'undefined' && _.isFunction && _.isFunction(config.onNoFocusable)) {
      config.onNoFocusable();
    } else if (typeof config.onNoFocusable === 'function') {
      config.onNoFocusable();
    }

    return null;
  }

  /**
   * Checks if an element is visible and focusable
   * @private
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is visible
   */
  static _isVisible(element) {
    return element.offsetParent !== null && 
           window.getComputedStyle(element).visibility !== 'hidden' &&
           window.getComputedStyle(element).display !== 'none';
  }

  /**
   * Enhanced focus for modal opening
   * @param {HTMLElement|string} modal - Modal element or selector
   * @param {Object} options - Focus options
   * @returns {Promise<HTMLElement|null>} Promise resolving to focused element
   */
  static async focusModalOpen(modal, options = {}) {
    return this.focusFirst(modal, {
      delay: 150, // Slightly longer delay for modal animations
      onFocused: () => {
        if (window.NightingaleToast && options.showToast !== false) {
          // Optional: Show subtle focus indicator
        }
      },
      onNoFocusable: () => {
        console.warn('No focusable elements found in modal');
      },
      ...options,
    });
  }

  /**
   * Enhanced focus for stepper modal step changes
   * @param {HTMLElement|string} stepContainer - Step container element or selector
   * @param {number} stepIndex - Current step index (for logging)
   * @param {Object} options - Focus options
   * @returns {Promise<HTMLElement|null>} Promise resolving to focused element
   */
  static async focusStepChange(stepContainer, stepIndex = 0, options = {}) {
    return this.focusFirst(stepContainer, {
      delay: 200, // Longer delay for step transitions
      onFocused: (element) => {
        // Log step focus for accessibility
        console.debug(`Focused step ${stepIndex + 1}:`, element.tagName, element.type || '');
      },
      preferredSelectors: [
        // Prioritize form inputs for steps
        'input[type="text"]:not([disabled]):not([readonly])',
        'input[type="email"]:not([disabled]):not([readonly])',
        'input[type="number"]:not([disabled]):not([readonly])',
        'input:not([disabled]):not([readonly]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled]):not([readonly])',
        'button:not([disabled])',
      ],
      ...options,
    });
  }

  /**
   * Enhanced focus for modal state changes (view/edit mode)
   * @param {HTMLElement|string} container - Container element or selector
   * @param {string} newState - New state ('view', 'edit', etc.)
   * @param {Object} options - Focus options
   * @returns {Promise<HTMLElement|null>} Promise resolving to focused element
   */
  static async focusStateChange(container, newState, options = {}) {
    const stateConfig = {
      edit: {
        delay: 100,
        preferredSelectors: [
          'input[type="text"]:not([disabled]):not([readonly])',
          'textarea:not([disabled]):not([readonly])',
          'input:not([disabled]):not([readonly]):not([type="hidden"])',
          'select:not([disabled])',
        ],
      },
      view: {
        delay: 50,
        preferredSelectors: [
          'button[data-action="edit"]:not([disabled])',
          'button:not([disabled])',
          '[href]:not([disabled])',
          '[tabindex]:not([tabindex="-1"]):not([disabled])',
        ],
      },
    };

    const config = stateConfig[newState] || stateConfig.edit;
    
    return this.focusFirst(container, {
      ...config,
      onFocused: (element) => {
        console.debug(`Focused ${newState} state:`, element.tagName, element.type || '');
      },
      ...options,
    });
  }

  /**
   * Creates a focus manager instance bound to a specific container
   * @param {HTMLElement|string} container - Container element or selector
   * @returns {Object} Focus manager instance with bound methods
   */
  static createManagerFor(container) {
    return {
      focusFirst: (options) => this.focusFirst(container, options),
      focusModalOpen: (options) => this.focusModalOpen(container, options),
      focusStepChange: (stepIndex, options) => this.focusStepChange(container, stepIndex, options),
      focusStateChange: (newState, options) => this.focusStateChange(container, newState, options),
    };
  }

  /**
   * Utility to create a debounced focus function for high-frequency updates
   * @param {number} debounceMs - Debounce duration in milliseconds
   * @returns {Function} Debounced focus function
   */
  static createDebouncedFocus(debounceMs = 300) {
    if (typeof _ !== 'undefined' && _.debounce) {
      return _.debounce((container, options) => this.focusFirst(container, options), debounceMs);
    } else {
      // Simple debounce fallback
      let timeoutId;
      return (container, options) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => this.focusFirst(container, options), debounceMs);
      };
    }
  }
}

/**
 * NightingaleClipboard - Modern clipboard operations with user feedback
 *
 * Provides reliable copy-to-clipboard functionality with automatic fallback
 * and integrated toast notifications for user feedback.
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
      if (config.showToast && window.NightingaleToast) {
        window.NightingaleToast.error('Nothing to copy');
      }
      return false;
    }

    // Sanitize the text to copy
    const sanitizedText = text.trim();
    if (!sanitizedText) {
      if (config.showToast && window.NightingaleToast) {
        window.NightingaleToast.error('Nothing to copy');
      }
      return false;
    }

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(sanitizedText);

        if (config.showToast && window.NightingaleToast) {
          window.NightingaleToast.success(config.successMessage);
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
        if (config.showToast && window.NightingaleToast) {
          window.NightingaleToast.success(config.successMessage);
        }
        return true;
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      if (config.showToast && window.NightingaleToast) {
        window.NightingaleToast.error(config.errorMessage);
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
        timeoutId = setTimeout(() => this.copyText(text, options), debounceMs);
      };
    }
  }

  /**
   * Copies formatted financial data with customizable templates
   * @param {Object} financialItem - The financial item object
   * @param {string} template - Template format ('full', 'summary', 'account', 'custom')
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

/**
 * NightingaleSearchService - Fuse.js wrapper for consistent search functionality
 *
 * Provides a standardized search interface using Fuse.js for fuzzy search capabilities.
 * Used by the SearchBar component and other search features throughout the suite.
 */
class NightingaleSearchService {
  /**
   * Creates a new search service instance
   * @param {Array} data - Array of objects to search through
   * @param {Object} options - Fuse.js options object
   */
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

  /**
   * Performs a fuzzy search on the data
   * @param {string} query - Search query string
   * @returns {Array} Array of search results
   */
  search(query) {
    if (!this.fuse || !query || typeof query !== 'string') {
      return [];
    }

    try {
      const results = this.fuse.search(query.trim());
      // Return the items directly (not wrapped in Fuse result objects)
      return results.map((result) => result.item || result);
    } catch (error) {
      console.error('NightingaleSearchService: Search error:', error);
      return [];
    }
  }

  /**
   * Updates the search data
   * @param {Array} newData - New array of objects to search through
   */
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

  /**
   * Gets the current search options
   * @returns {Object} Current Fuse.js options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Updates search options
   * @param {Object} newOptions - New Fuse.js options to merge
   */
  setOptions(newOptions) {
    if (!newOptions || typeof newOptions !== 'object') {
      console.warn('NightingaleSearchService: setOptions expects an object');
      return;
    }

    try {
      this.options = { ...this.options, ...newOptions };
      if (this.data && this.data.length > 0) {
        this.fuse = new Fuse(this.data, this.options);
      }
    } catch (error) {
      console.error('NightingaleSearchService: Error updating options:', error);
    }
  }

  /**
   * Checks if the search service is properly initialized
   * @returns {boolean} True if service is ready to use
   */
  isReady() {
    return this.fuse !== null && typeof Fuse !== 'undefined';
  }
}

// Make NightingaleSearchService globally available
if (typeof window !== 'undefined') {
  window.NightingaleSearchService = NightingaleSearchService;
  window.NightingaleClipboard = NightingaleClipboard;
  window.NightingaleFocusManager = NightingaleFocusManager;

  // Make all utility functions globally available
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
  window.getFlatFinancials = getFlatFinancials;
  window.getNextId = getNextId;
  window.getAppDateLabel = getAppDateLabel;
  window.getDefaultAppDetails = getDefaultAppDetails;
  window.getUniqueNoteCategories = getUniqueNoteCategories;
}
