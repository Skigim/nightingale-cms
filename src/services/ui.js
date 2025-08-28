/**
 * Nightingale UI Utilities Service
 *
 * Provides utility functions for UI interaction, navigation, and user experience.
 * This service handles non-business-logic UI operations that are shared across components.
 *
 * @namespace NightingaleUIUtilities
 * @version 1.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

(function (window) {
  'use strict';

  /**
   * Advanced focus management for modals and UI components
   */
  class NightingaleFocusManager {
    /**
     * Intelligently focuses the first appropriate element in a container
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Object} options - Focus configuration options
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
      const containerElement =
        typeof container === 'string'
          ? document.querySelector(container)
          : container;

      if (!containerElement) {
        return null;
      }

      // Create focus function
      const performFocus = () => {
        return this._findAndFocusElement(containerElement, config);
      };

      // Apply debouncing if requested and Lodash is available
      if (config.debounce && typeof _ !== 'undefined' && _.debounce) {
        const debouncedFocus = _.debounce(performFocus, 50);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(debouncedFocus());
          }, config.delay);
        });
      } else {
        // Simple delay without debouncing
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(performFocus());
          }, config.delay);
        });
      }
    }

    /**
     * Finds and focuses the best available element
     * @private
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
              if (typeof config.onFocused === 'function') {
                config.onFocused(element);
              }
              return element;
            }
          } catch (error) {
            // When one falls, we continue - focus attempt failed but expedition proceeds
            const logger = window.NightingaleLogger?.get('ui:focus');
            logger?.debug('Focus attempt failed, we continue.', {
              selector,
              error: error.message,
              element: element?.tagName || 'unknown',
            });
          }
        }
      }

      // No focusable element found
      if (typeof config.onNoFocusable === 'function') {
        config.onNoFocusable();
      }

      return null;
    }

    /**
     * Checks if an element is visible and focusable
     * @private
     */
    static _isVisible(element) {
      return (
        element.offsetParent !== null &&
        window.getComputedStyle(element).visibility !== 'hidden' &&
        window.getComputedStyle(element).display !== 'none'
      );
    }

    /**
     * Enhanced focus for modal opening
     */
    static async focusModalOpen(modal, options = {}) {
      return this.focusFirst(modal, {
        delay: 150,
        onFocused: () => {},
        onNoFocusable: () => {},
        ...options,
      });
    }

    /**
     * Enhanced focus for stepper modal step changes
     */
    static async focusStepChange(stepContainer, options = {}) {
      return this.focusFirst(stepContainer, {
        delay: 200,
        preferredSelectors: [
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
        ...options,
      });
    }

    /**
     * Creates a focus manager instance bound to a specific container
     */
    static createManagerFor(container) {
      return {
        focusFirst: (options) => this.focusFirst(container, options),
        focusModalOpen: (options) => this.focusModalOpen(container, options),
        focusStepChange: (options) => this.focusStepChange(container, options),
        focusStateChange: (newState, options) =>
          this.focusStateChange(container, newState, options),
      };
    }
  }

  /**
   * Scroll to a specific section with smooth animation
   * @param {string} sectionSelector - CSS selector for target section
   * @param {Object} options - Scroll behavior options
   */
  function scrollToSection(
    sectionSelector = '[data-section="notes"]',
    options = {}
  ) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    };

    const scrollOptions = { ...defaultOptions, ...options };
    const section = document.querySelector(sectionSelector);

    if (section) {
      section.scrollIntoView(scrollOptions);
    }
    // Section not found - silently ignore
  }

  /**
   * Legacy wrapper for scrollToNotes - maintains backward compatibility
   */
  function scrollToNotes() {
    scrollToSection('[data-section="notes"]');
  }

  /**
   * Test data integrity broadcast system
   */
  function testDataIntegrityBroadcast() {
    try {
      const channel = new BroadcastChannel('nightingale_suite');
      channel.postMessage({
        type: 'data_updated',
        source: 'cms-react',
        timestamp: new Date().toISOString(),
        testMode: true,
      });
      channel.close();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check application status and dependencies
   */
  function checkAppStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      services: {},
      components: {},
      data: {},
      browser: {},
    };

    // Check services
    status.services.nightingaleServices = !!window.NightingaleServices;
    status.services.dataManagement = !!window.NightingaleDataManagement;
    status.services.fileService = !!window.fileService;
    status.services.toastService = !!window.showToast;

    // Check components
    status.components.react = !!window.React;
    status.components.reactDOM = !!window.ReactDOM;
    status.components.componentLibrary = !!window.NightingaleComponentLibrary;

    // Check data
    status.data.localStorage = !!window.localStorage;
    status.data.savedData = !!localStorage.getItem('nightingale_data');

    // Check browser features
    status.browser.clipboard = !!navigator.clipboard;
    status.browser.broadcastChannel = !!window.BroadcastChannel;
    status.browser.fetch = !!window.fetch;

    return status;
  }

  /**
   * Debug utility to dump component library status
   */
  function debugComponentLibrary() {
    if (window.NightingaleComponentLibrary) {
      // Placeholder: structured logger hook will emit component registry status here.
      // Returning lightweight snapshot (non-logging) keeps function non-empty and lint-compliant.
      return {
        registrySize: Object.keys(window.NightingaleComponentLibrary || {})
          .length,
        // next: logger.debug('componentLibrary.status', { size: registrySize })
      };
    }
    // No component library available
    return null;
  }

  // Create service object
  const NightingaleUIUtilities = {
    // Focus management
    FocusManager: NightingaleFocusManager,

    // Navigation utilities
    scrollToSection,
    scrollToNotes, // Legacy compatibility

    // Development utilities
    testDataIntegrityBroadcast,
    checkAppStatus,
    debugComponentLibrary,

    // Metadata
    version: '1.0.0',
    name: 'NightingaleUIUtilities',
  };

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.NightingaleUIUtilities = NightingaleUIUtilities;
    window.NightingaleFocusManager = NightingaleFocusManager;

    // Register with service registry if available
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      window.NightingaleServices.registerService(
        'uiUtilities',
        NightingaleUIUtilities,
        'ui'
      );
    }

    // Legacy global functions for backward compatibility
    window.scrollToSection = scrollToSection;
    window.scrollToNotes = scrollToNotes;
    window.testDataIntegrityBroadcast = testDataIntegrityBroadcast;
    window.checkAppStatus = checkAppStatus;
    window.debugComponentLibrary = debugComponentLibrary;
  }

  // Return service for module systems
  return NightingaleUIUtilities;
})(typeof window !== 'undefined' ? window : this);

// ES6 Module Export
export default (typeof window !== 'undefined' &&
  window.NightingaleUIUtilities) ||
  null;
