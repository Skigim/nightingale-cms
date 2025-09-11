/**
 * Nightingale Application Suite - Toast Notification System
 *
 * A comprehensive toast notification system that provides consistent
 * user feedback across all Nightingale applications. Supports multiple
 * toast types, queue management, and auto-dismiss functionality.
 */

// TODO: Replace with proper import once logger is modernized
// import NightingaleLogger from './nightingale.logger.js';

/**
 * Toast notification system configuration
 */
const TOAST_CONFIG = {
  // Default toast duration in milliseconds
  defaultDuration: 3000,

  // Maximum number of toasts to show simultaneously
  maxToasts: 5,

  // Animation timing
  animationDelay: 10, // Delay before showing animation

  // Toast types and their styling
  types: {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  },

  // Container styling
  containerClasses: 'fixed bottom-6 right-6 z-[2000] flex flex-col gap-3',

  // Base toast styling
  baseClasses:
    'toast px-4 py-2 rounded-md shadow-lg text-white font-semibold transition-all duration-300 ease-in-out opacity-0 transform translate-x-full',

  // Show state styling
  showClasses: 'opacity-100 transform translate-x-0',
};

/**
 * Toast queue management
 */
class ToastQueue {
  constructor() {
    this.toasts = [];
    this.container = null;
    this.ensureContainer();
  }

  /**
   * Ensures the toast container exists in the DOM
   */
  ensureContainer() {
    let container = document.getElementById('toast-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = TOAST_CONFIG.containerClasses;
      document.body.appendChild(container);
    }

    this.container = container;
  }

  /**
   * Adds a toast to the queue and displays it
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Custom duration in milliseconds (optional)
   */
  add(message, type = 'info', duration = null) {
    // Validate message
    if (!message || typeof message !== 'string') {
      return;
    }

    // Validate type
    if (!TOAST_CONFIG.types[type]) {
      type = 'info';
    }

    // Use default duration if not specified
    const toastDuration = duration || TOAST_CONFIG.defaultDuration;

    // Remove oldest toasts if we're at max capacity
    while (this.toasts.length >= TOAST_CONFIG.maxToasts) {
      this.removeOldest();
    }

    // Create toast element first
    const toastElement = document.createElement('div');

    // Add to tracking array
    const toastData = {
      element: toastElement,
      timestamp: Date.now(),
      duration: toastDuration,
      type,
      message,
      timeoutId: null,
    };

    this.toasts.push(toastData);

    // Now configure the element with proper references
    this.configureElement(
      toastElement,
      message,
      type,
      toastDuration,
      toastData,
    );

    // Add to container
    this.container.appendChild(toastElement);

    // Trigger show animation
    setTimeout(() => {
      toastElement.classList.add(...TOAST_CONFIG.showClasses.split(' '));
    }, TOAST_CONFIG.animationDelay);

    // Auto-remove after duration (with pause support)
    const timeoutId = setTimeout(() => {
      this.remove(toastData);
    }, toastDuration);

    // Store timeout ID for potential cancellation
    toastData.timeoutId = timeoutId;

    return toastData;
  }

  /**
   * Configures a toast DOM element
   * @param {HTMLElement} toastElement - Toast element to configure
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   * @param {number} duration - Toast duration
   * @param {Object} toastData - Toast data object reference
   */
  configureElement(toastElement, message, type, duration, toastData) {
    // Set base classes
    toastElement.className = `${TOAST_CONFIG.baseClasses} ${TOAST_CONFIG.types[type]}`;

    // Set message content
    toastElement.textContent = message;

    // Add click to dismiss functionality
    toastElement.addEventListener('click', () => {
      this.remove(toastData);
    });

    // Add hover to pause auto-dismiss
    let remainingTime = duration;
    let pauseStartTime = null;

    toastElement.addEventListener('mouseenter', () => {
      if (toastData.timeoutId) {
        clearTimeout(toastData.timeoutId);
        pauseStartTime = Date.now();
      }
      toastElement.style.cursor = 'pointer';
    });

    toastElement.addEventListener('mouseleave', () => {
      if (pauseStartTime) {
        remainingTime -= Date.now() - pauseStartTime;
        pauseStartTime = null;

        // Restart timeout with remaining time
        toastData.timeoutId = setTimeout(
          () => {
            const toastIndex = this.toasts.indexOf(toastData);
            if (toastIndex > -1) {
              this.remove(toastData);
            }
          },
          Math.max(remainingTime, 100),
        ); // Minimum 100ms
      }
    });
  }

  /**
   * Removes a specific toast
   * @param {Object} toastData - Toast data object
   */
  remove(toastData) {
    if (!toastData || !toastData.element) {
      return;
    }

    // Cancel any pending timeout
    if (toastData.timeoutId) {
      clearTimeout(toastData.timeoutId);
    }

    // Remove from tracking array
    const index = this.toasts.indexOf(toastData);
    if (index > -1) {
      this.toasts.splice(index, 1);
    }

    // Start hide animation
    toastData.element.classList.remove(...TOAST_CONFIG.showClasses.split(' '));

    // Remove from DOM after animation
    toastData.element.addEventListener(
      'transitionend',
      () => {
        if (toastData.element.parentNode) {
          toastData.element.parentNode.removeChild(toastData.element);
        }
      },
      { once: true },
    );

    // Fallback removal in case transitionend doesn't fire
    setTimeout(() => {
      if (toastData.element.parentNode) {
        toastData.element.parentNode.removeChild(toastData.element);
      }
    }, 500);
  }

  /**
   * Removes the oldest toast
   */
  removeOldest() {
    if (this.toasts.length > 0) {
      this.remove(this.toasts[0]);
    }
  }

  /**
   * Clears all toasts
   */
  clear() {
    while (this.toasts.length > 0) {
      this.remove(this.toasts[0]);
    }
  }

  /**
   * Gets current toast count
   * @returns {number} Number of active toasts
   */
  getCount() {
    return this.toasts.length;
  }
}

// Create global toast queue instance
let toastQueue = null;

/**
 * Initializes the toast system
 * @returns {ToastQueue} Toast queue instance
 */
function initializeToastSystem() {
  if (!toastQueue) {
    toastQueue = new ToastQueue();
  }
  return toastQueue;
}

/**
 * Main toast function - displays a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Custom duration in milliseconds (optional)
 * @returns {Object|null} Toast data object or null if invalid
 */
function showToast(message, type = 'info', duration = null) {
  try {
    // Ensure DOM is ready before showing toasts
    if (typeof document === 'undefined') {
      console.warn('Toast system: DOM not available');
      return null;
    }

    // Initialize if needed
    if (!toastQueue) {
      initializeToastSystem();
    }

    // Validate message before processing
    if (!message || typeof message !== 'string') {
      console.warn('Toast system: Invalid message provided', message);
      return null;
    }

    return toastQueue.add(message, type, duration);
  } catch (error) {
    const logger = window.NightingaleLogger?.get('toast:system');
    logger?.error('Toast system failed', {
      error: error.message,
      message,
      type,
    });
    // Fallback to console for critical errors
    console.error('Toast system failure:', error.message, { message, type });
    return null;
  }
}

/**
 * Convenience functions for specific toast types
 */
const showSuccessToast = (message, duration) =>
  showToast(message, 'success', duration);
const showErrorToast = (message, duration) =>
  showToast(message, 'error', duration);
const showWarningToast = (message, duration) =>
  showToast(message, 'warning', duration);
const showInfoToast = (message, duration) =>
  showToast(message, 'info', duration);

/**
 * Clears all active toasts
 */
function clearAllToasts() {
  if (toastQueue) {
    toastQueue.clear();
  }
}

/**
 * Gets the current number of active toasts
 * @returns {number} Number of active toasts
 */
function getActiveToastCount() {
  return toastQueue ? toastQueue.getCount() : 0;
}

/**
 * Updates toast system configuration
 * @param {Object} newConfig - Configuration updates
 */
function updateToastConfig(newConfig) {
  if (typeof newConfig === 'object' && newConfig !== null) {
    Object.assign(TOAST_CONFIG, newConfig);
  }
}

// CSS injection for toast styling (auto-inject if not present)
function injectToastCSS() {
  // Check if CSS is already injected
  if (document.getElementById('nightingale-toast-css')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'nightingale-toast-css';
  style.textContent = `
    .toast {
      transition: all 0.3s ease-in-out;
      opacity: 0;
      transform: translateX(100%);
      cursor: pointer;
    }
    .toast.opacity-100 {
      opacity: 1;
    }
    .toast.transform.translate-x-0 {
      transform: translateX(0);
    }
    #toast-container {
      pointer-events: none;
    }
    #toast-container .toast {
      pointer-events: auto;
    }
  `;

  document.head.appendChild(style);
}

// Auto-inject CSS when script loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToastCSS);
  } else {
    injectToastCSS();
  }
}

// Initialize the system immediately when available
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeToastSystem();
    });
  } else {
    initializeToastSystem();
  }
}

// Named exports
export {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  clearAllToasts,
  getActiveToastCount,
  updateToastConfig,
  initializeToastSystem,
  ToastQueue,
  TOAST_CONFIG,
};

// ES6 Module Export
export default {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  clearAllToasts,
  getActiveToastCount,
  updateToastConfig,
  initializeToastSystem,
  ToastQueue,
  TOAST_CONFIG,
  show: showToast, // Alias for backward compatibility
};
