/**
 * Nightingale CMS Autosave Service
 *
 * Provides intelligent autosave functionality with:
 * - Configurable save intervals
 * - Data change detection with debouncing
 * - Error handling and retry logic
 * - Status reporting for UI feedback
 * - Integration with existing file service
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

(function (global) {
  'use strict';

  /**
   * AutosaveService - Manages automatic saving of application data
   */
  class AutosaveService {
    constructor(options = {}) {
      // Configuration with sensible defaults
      this.config = {
        // Save interval in milliseconds (default: 30 seconds)
        saveInterval: options.saveInterval || 30000,

        // Debounce delay for data changes (default: 2 seconds)
        debounceDelay: options.debounceDelay || 2000,

        // Maximum retry attempts for failed saves
        maxRetries: options.maxRetries || 3,

        // Retry delay multiplier (exponential backoff)
        retryDelayMultiplier: options.retryDelayMultiplier || 1.5,

        // Initial retry delay in milliseconds
        initialRetryDelay: options.initialRetryDelay || 1000,

        // Enable/disable autosave
        enabled: options.enabled !== false,

        // Save on visibility change (when user switches tabs/windows)
        saveOnVisibilityChange: options.saveOnVisibilityChange !== false,

        // Save on page unload
        saveOnUnload: options.saveOnUnload !== false,

        // Minimum time between saves (prevents excessive saving)
        minSaveInterval: options.minSaveInterval || 5000,
      };

      // State management
      this.state = {
        isEnabled: this.config.enabled,
        lastSaveTime: 0,
        saveInProgress: false,
        retryCount: 0,
        pendingSave: false,
        lastDataHash: null,
        saveQueue: [],
        statistics: {
          totalSaves: 0,
          successfulSaves: 0,
          failedSaves: 0,
          lastSaveAttempt: null,
          lastSuccessfulSave: null,
          averageSaveTime: 0,
        },
      };

      // Event handlers and timers
      this.saveIntervalTimer = null;
      this.debounceTimer = null;
      this.retryTimer = null;
      this.eventListeners = [];

      // Dependencies
      this.fileService = null;
      this.dataProvider = null;
      this.statusCallback = null;

      // Bind methods
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
      this.handlePageHide = this.handlePageHide.bind(this);
    }

    /**
     * Initialize the autosave service
     * @param {Object} dependencies - Required dependencies
     * @param {Object} dependencies.fileService - File service for saving data
     * @param {Function} dependencies.dataProvider - Function that returns current data
     * @param {Function} dependencies.statusCallback - Optional callback for status updates
     */
    initialize(dependencies) {
      if (!dependencies.fileService) {
        throw new Error('AutosaveService: fileService is required');
      }
      if (!dependencies.dataProvider) {
        throw new Error('AutosaveService: dataProvider function is required');
      }

      this.fileService = dependencies.fileService;
      this.dataProvider = dependencies.dataProvider;
      this.statusCallback =
        dependencies.statusCallback || this.defaultStatusCallback;

      // Set up event listeners
      this.setupEventListeners();

      // Start autosave if enabled
      if (this.state.isEnabled) {
        this.start();
      }

      this.log('AutosaveService initialized', 'info');
      this.updateStatus('initialized', 'Autosave service initialized');
    }

    /**
     * Start the autosave service
     */
    start() {
      if (!this.fileService || !this.dataProvider) {
        throw new Error('AutosaveService: Must be initialized before starting');
      }

      this.state.isEnabled = true;
      this.startPeriodicSave();
      this.updateStatus('started', 'Autosave service started');
      this.log('AutosaveService started', 'info');
    }

    /**
     * Stop the autosave service
     */
    stop() {
      this.state.isEnabled = false;
      this.stopPeriodicSave();
      this.clearTimers();
      this.updateStatus('stopped', 'Autosave service stopped');
      this.log('AutosaveService stopped', 'info');
    }

    /**
     * Pause autosave temporarily
     */
    pause() {
      this.stopPeriodicSave();
      this.updateStatus('paused', 'Autosave paused');
      this.log('AutosaveService paused', 'info');
    }

    /**
     * Resume autosave
     */
    resume() {
      if (this.state.isEnabled) {
        this.startPeriodicSave();
        this.updateStatus('resumed', 'Autosave resumed');
        this.log('AutosaveService resumed', 'info');
      }
    }

    /**
     * Trigger an immediate save (respects minimum save interval)
     * @param {Object} options - Save options
     * @param {boolean} options.force - Force save even if no changes detected
     * @param {boolean} options.skipThrottle - Skip minimum save interval check
     * @returns {Promise<boolean>} - Save success status
     */
    async saveNow(options = {}) {
      const { force = false, skipThrottle = false } = options;

      // Check minimum save interval unless skipped
      if (!skipThrottle && !this.canSaveNow()) {
        this.log('Save throttled - minimum interval not met', 'debug');
        return false;
      }

      // Check if save is already in progress
      if (this.state.saveInProgress) {
        this.log('Save already in progress - queuing request', 'debug');
        this.state.pendingSave = true;
        return false;
      }

      return await this.performSave({ force });
    }

    /**
     * Register a data change to trigger debounced autosave
     * @param {string} changeType - Type of change (optional, for logging)
     */
    notifyDataChange(changeType = 'unknown') {
      if (!this.state.isEnabled) {
        return;
      }

      this.log(`Data change detected: ${changeType}`, 'debug');

      // Clear existing debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Set new debounce timer
      this.debounceTimer = setTimeout(() => {
        this.debouncedSave();
      }, this.config.debounceDelay);
    }

    /**
     * Get current autosave status and statistics
     * @returns {Object} - Status information
     */
    getStatus() {
      return {
        isEnabled: this.state.isEnabled,
        saveInProgress: this.state.saveInProgress,
        pendingSave: this.state.pendingSave,
        lastSaveTime: this.state.lastSaveTime,
        statistics: { ...this.state.statistics },
        config: { ...this.config },
        nextScheduledSave: this.saveIntervalTimer
          ? Date.now() + this.config.saveInterval
          : null,
      };
    }

    /**
     * Update autosave configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
      const oldConfig = { ...this.config };
      this.config = { ...this.config, ...newConfig };

      // Restart with new configuration if needed
      if (
        this.state.isEnabled &&
        oldConfig.saveInterval !== this.config.saveInterval
      ) {
        this.stopPeriodicSave();
        this.startPeriodicSave();
      }

      this.log('Configuration updated', 'info', { newConfig });
      this.updateStatus('config-updated', 'Autosave configuration updated');
    }

    /**
     * Clean up resources and event listeners
     */
    destroy() {
      this.stop();
      this.removeEventListeners();
      this.fileService = null;
      this.dataProvider = null;
      this.statusCallback = null;
      this.log('AutosaveService destroyed', 'info');
    }

    // Private methods

    /**
     * Set up DOM event listeners
     */
    setupEventListeners() {
      if (this.config.saveOnVisibilityChange) {
        document.addEventListener(
          'visibilitychange',
          this.handleVisibilityChange
        );
        this.eventListeners.push({
          element: document,
          event: 'visibilitychange',
          handler: this.handleVisibilityChange,
        });
      }

      if (this.config.saveOnUnload) {
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        window.addEventListener('pagehide', this.handlePageHide);
        this.eventListeners.push(
          {
            element: window,
            event: 'beforeunload',
            handler: this.handleBeforeUnload,
          },
          {
            element: window,
            event: 'pagehide',
            handler: this.handlePageHide,
          }
        );
      }
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
      this.eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListeners = [];
    }

    /**
     * Start periodic save timer
     */
    startPeriodicSave() {
      this.stopPeriodicSave(); // Clear any existing timer

      this.saveIntervalTimer = setInterval(() => {
        this.periodicSave();
      }, this.config.saveInterval);
    }

    /**
     * Stop periodic save timer
     */
    stopPeriodicSave() {
      if (this.saveIntervalTimer) {
        clearInterval(this.saveIntervalTimer);
        this.saveIntervalTimer = null;
      }
    }

    /**
     * Clear all timers
     */
    clearTimers() {
      this.stopPeriodicSave();

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    }

    /**
     * Check if save can be performed now (respects minimum interval)
     */
    canSaveNow() {
      const timeSinceLastSave = Date.now() - this.state.lastSaveTime;
      return timeSinceLastSave >= this.config.minSaveInterval;
    }

    /**
     * Check if data has changed since last save
     */
    hasDataChanged() {
      try {
        const currentData = this.dataProvider();
        const currentHash = this.generateDataHash(currentData);

        if (this.state.lastDataHash === null) {
          this.state.lastDataHash = currentHash;
          return true; // First time, assume changed
        }

        const hasChanged = currentHash !== this.state.lastDataHash;
        if (hasChanged) {
          this.state.lastDataHash = currentHash;
        }

        return hasChanged;
      } catch (error) {
        this.log('Error checking data changes', 'error', error);
        return false;
      }
    }

    /**
     * Generate a simple hash of the data for change detection
     */
    generateDataHash(data) {
      const jsonString = JSON.stringify(data);
      let hash = 0;

      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return hash.toString();
    }

    /**
     * Perform the actual save operation
     */
    async performSave(options = {}) {
      const { force = false } = options;
      const startTime = Date.now();

      this.state.saveInProgress = true;
      this.state.statistics.totalSaves++;
      this.state.statistics.lastSaveAttempt = startTime;

      this.updateStatus('saving', 'Saving data...');
      this.log('Starting save operation', 'debug', { force });

      try {
        // Check if data has changed unless forced
        if (!force && !this.hasDataChanged()) {
          this.log('No data changes detected - skipping save', 'debug');
          this.state.saveInProgress = false;
          this.updateStatus('no-changes', 'No changes to save');
          return true;
        }

        // Get current data
        const data = this.dataProvider();
        if (!data) {
          throw new Error('No data available to save');
        }

        // Perform the save
        const success = await this.fileService.writeFile(data);

        if (success) {
          const saveTime = Date.now() - startTime;
          this.handleSaveSuccess(saveTime);
          return true;
        } else {
          throw new Error('FileService returned false');
        }
      } catch (error) {
        this.handleSaveError(error);
        return false;
      } finally {
        this.state.saveInProgress = false;

        // Check if there's a pending save request
        if (this.state.pendingSave) {
          this.state.pendingSave = false;
          // Schedule another save attempt
          setTimeout(() => this.saveNow(), 100);
        }
      }
    }

    /**
     * Handle successful save
     */
    handleSaveSuccess(saveTime) {
      this.state.lastSaveTime = Date.now();
      this.state.retryCount = 0;
      this.state.statistics.successfulSaves++;
      this.state.statistics.lastSuccessfulSave = this.state.lastSaveTime;

      // Update average save time
      const { averageSaveTime, totalSaves } = this.state.statistics;
      this.state.statistics.averageSaveTime =
        (averageSaveTime * (totalSaves - 1) + saveTime) / totalSaves;

      this.log(`Save successful in ${saveTime}ms`, 'info');
      this.updateStatus('saved', `Data saved successfully`);

      // Send broadcast notification
      this.sendDataUpdateBroadcast();
    }

    /**
     * Handle save error
     */
    handleSaveError(error) {
      this.state.statistics.failedSaves++;
      this.state.retryCount++;

      this.log('Save failed', 'error', error);
      this.updateStatus('error', `Save failed: ${error.message}`);

      // Schedule retry if within limits
      if (this.state.retryCount <= this.config.maxRetries) {
        this.scheduleRetry();
      } else {
        this.log('Max retries exceeded - giving up', 'error');
        this.updateStatus('max-retries', 'Save failed after maximum retries');
        this.state.retryCount = 0;
      }
    }

    /**
     * Schedule a retry attempt
     */
    scheduleRetry() {
      const delay =
        this.config.initialRetryDelay *
        Math.pow(this.config.retryDelayMultiplier, this.state.retryCount - 1);

      this.log(
        `Scheduling retry ${this.state.retryCount} in ${delay}ms`,
        'info'
      );
      this.updateStatus(
        'retry-scheduled',
        `Retry scheduled in ${Math.round(delay / 1000)}s`
      );

      this.retryTimer = setTimeout(() => {
        this.saveNow({ force: true, skipThrottle: true });
      }, delay);
    }

    /**
     * Periodic save triggered by timer
     */
    async periodicSave() {
      if (!this.state.isEnabled || this.state.saveInProgress) {
        return;
      }

      this.log('Periodic save triggered', 'debug');
      await this.saveNow();
    }

    /**
     * Debounced save triggered by data changes
     */
    async debouncedSave() {
      if (!this.state.isEnabled || this.state.saveInProgress) {
        return;
      }

      this.log('Debounced save triggered', 'debug');
      await this.saveNow();
    }

    /**
     * Send broadcast notification about data update
     */
    sendDataUpdateBroadcast() {
      try {
        const channel = new BroadcastChannel('nightingale_suite');
        channel.postMessage({
          type: 'data_updated',
          source: 'cms-react-autosave',
          timestamp: new Date().toISOString(),
        });
        channel.close();
        this.log('Data update broadcast sent', 'debug');
      } catch (error) {
        this.log('Failed to send broadcast', 'error', error);
      }
    }

    // Event handlers

    /**
     * Handle visibility change (tab switching)
     */
    handleVisibilityChange() {
      if (document.hidden) {
        // Page is hidden - save immediately
        this.log('Page hidden - triggering save', 'debug');
        this.saveNow({ skipThrottle: true });
      } else {
        // Page is visible - resume normal operation
        this.log('Page visible - resuming normal operation', 'debug');
      }
    }

    /**
     * Handle before unload event
     */
    handleBeforeUnload(event) {
      if (this.state.pendingSave || this.hasDataChanged()) {
        // Synchronous save for unload events
        this.log('Page unloading with unsaved changes', 'warn');

        // Modern browsers ignore custom messages, but we set one anyway
        const message =
          'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    }

    /**
     * Handle page hide event (more reliable than beforeunload)
     */
    handlePageHide() {
      if (this.state.pendingSave || this.hasDataChanged()) {
        this.log('Page hiding - attempting final save', 'info');
        // Try to save, but don't block the page hide
        this.saveNow({ force: true, skipThrottle: true }).catch((error) => {
          this.log('Final save failed', 'error', error);
        });
      }
    }

    // Utility methods

    /**
     * Update status via callback
     */
    updateStatus(status, message, data = null) {
      if (this.statusCallback) {
        this.statusCallback({
          status,
          message,
          timestamp: Date.now(),
          data,
          statistics: this.state.statistics,
        });
      }
    }

    /**
     * Default status callback (console logging)
     */
    defaultStatusCallback(statusData) {
      this.log(`Status: ${statusData.status} - ${statusData.message}`, 'info');
    }

    /**
     * Logging utility
     */
    log(message, level = 'info', data = null) {
      const logMessage = `[AutosaveService] ${message}`;

      switch (level) {
        case 'error':
          console.error(logMessage, data);
          break;
        case 'warn':
          console.warn(logMessage, data);
          break;
        case 'debug':
          console.debug && console.debug(logMessage, data);
          break;
        default:
          console.log(logMessage, data);
      }
    }
  }

  // Static factory method for easy initialization
  AutosaveService.create = function (options = {}) {
    return new AutosaveService(options);
  };

  // Export to global namespace
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = AutosaveService;
  } else {
    // Browser environment
    global.AutosaveService = AutosaveService;
    global.NightingaleAutosaveService = AutosaveService; // Namespace alias
  }
})(typeof window !== 'undefined' ? window : global);
