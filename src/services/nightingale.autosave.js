/**
 * Nightingale CMS Autosave Service v2.0
 *
 * Enhanced autosave functionality with:
 * - Permission-aware operation
 * - Enhanced error categorization and recovery
 * - Multi-tab coordination
 * - Configuration and statistics persistence
 * - Intelligent retry strategies
 *
 * @version 2.0.0
 * @author Nightingale CMS Team
 */

(function (global) {
  'use strict';

  /**
   * Enhanced error types for better categorization
   */
  class AutosaveError extends Error {
    constructor(message, type, recoverable = true, userAction = null) {
      super(message);
      this.name = 'AutosaveError';
      this.type = type;
      this.recoverable = recoverable;
      this.userAction = userAction;
      this.timestamp = Date.now();
    }
  }

  /**
   * Error types and their characteristics
   */
  const ERROR_TYPES = {
    PERMISSION_DENIED: {
      type: 'permission',
      recoverable: true,
      userAction: 'Please reconnect to your save folder in settings',
      retryStrategy: 'manual',
    },
    NETWORK_ERROR: {
      type: 'network',
      recoverable: true,
      userAction: 'Check your network connection and try again',
      retryStrategy: 'exponential',
    },
    STORAGE_FULL: {
      type: 'storage',
      recoverable: false,
      userAction: 'Free up disk space and try again',
      retryStrategy: 'manual',
    },
    FILE_LOCKED: {
      type: 'file-lock',
      recoverable: true,
      userAction: 'File may be open in another application',
      retryStrategy: 'linear',
    },
    UNKNOWN: {
      type: 'unknown',
      recoverable: true,
      userAction: 'Please try again or contact support',
      retryStrategy: 'exponential',
    },
  };

  /**
   * AutosaveService - Enhanced automatic saving with permission awareness and persistence
   */
  class AutosaveService {
    constructor(options = {}) {
      // Enhanced configuration with persistence support
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

        // Permission checking interval (default: 10 seconds)
        permissionCheckInterval: options.permissionCheckInterval || 10000,

        // Persist configuration across sessions
        persistConfig: options.persistConfig !== false,

        // Persist statistics across sessions
        persistStats: options.persistStats !== false,

        // Multi-tab coordination
        enableTabCoordination: options.enableTabCoordination !== false,
      };

      // Generate unique tab ID for multi-tab coordination
      this.tabId =
        options.tabId ||
        `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Enhanced state management
      this.state = {
        isEnabled: this.config.enabled,
        lastSaveTime: 0,
        saveInProgress: false,
        retryCount: 0,
        pendingSave: false,
        lastDataHash: null,
        saveQueue: [],
        permissionStatus: 'unknown', // 'granted', 'denied', 'prompt', 'unknown'
        lastPermissionCheck: 0,
        isPermissionWatcherActive: false,
        statistics: {
          totalSaves: 0,
          successfulSaves: 0,
          failedSaves: 0,
          lastSaveAttempt: null,
          lastSuccessfulSave: null,
          averageSaveTime: 0,
          sessionStartTime: Date.now(),
          errorsByType: {},
          saveTimes: [], // Rolling window of save times
        },
      };

      // Storage keys for persistence
      this.storageKeys = {
        config: `nightingale-autosave-config-${this.getDirectoryKey()}`,
        stats: `nightingale-autosave-stats-${this.getDirectoryKey()}`,
        tabState: 'nightingale-autosave-tabs',
      };

      // Event handlers and timers
      this.saveIntervalTimer = null;
      this.debounceTimer = null;
      this.retryTimer = null;
      this.permissionWatcherTimer = null;
      this.eventListeners = [];

      // Dependencies
      this.fileService = null;
      this.dataProvider = null;
      this.statusCallback = null;

      // BroadcastChannel for tab coordination
      this.broadcastChannel = null;

      // Bind methods
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
      this.handlePageHide = this.handlePageHide.bind(this);
      this.handleBroadcastMessage = this.handleBroadcastMessage.bind(this);
      this.checkPermissions = this.checkPermissions.bind(this);

      // Load persisted configuration and statistics
      this.loadPersistedState();
    }

    /**
     * Get directory-specific key for storage
     */
    getDirectoryKey() {
      // Use a simple hash based on current origin for now
      // In a real implementation, this could be based on the connected directory path
      return btoa(window.location.origin)
        .replace(/[^a-zA-Z0-9]/g, '')
        .substr(0, 16);
    }

    /**
     * Load persisted configuration and statistics
     */
    loadPersistedState() {
      try {
        // Load persisted configuration
        if (this.config.persistConfig) {
          const savedConfig = localStorage.getItem(this.storageKeys.config);
          if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            // Only override non-constructor provided values
            Object.keys(parsed).forEach((key) => {
              if (
                Object.prototype.hasOwnProperty.call(this.config, key) &&
                key !== 'persistConfig' &&
                key !== 'persistStats'
              ) {
                this.config[key] = parsed[key];
              }
            });
            this.log('Loaded persisted configuration', 'info');
          }
        }

        // Load persisted statistics
        if (this.config.persistStats) {
          const savedStats = localStorage.getItem(this.storageKeys.stats);
          if (savedStats) {
            const parsed = JSON.parse(savedStats);
            // Merge with current statistics, keeping session-specific data
            this.state.statistics = {
              ...this.state.statistics,
              ...parsed,
              sessionStartTime: Date.now(), // Reset session start time
              saveTimes: parsed.saveTimes || [], // Preserve save time history
            };
            this.log('Loaded persisted statistics', 'info');
          }
        }
      } catch (error) {
        this.log('Error loading persisted state: ' + error.message, 'warn');
      }
    }

    /**
     * Persist current configuration and statistics
     */
    persistState() {
      try {
        if (this.config.persistConfig) {
          localStorage.setItem(
            this.storageKeys.config,
            JSON.stringify(this.config)
          );
        }

        if (this.config.persistStats) {
          // Keep only recent save times (last 100)
          const recentSaveTimes = this.state.statistics.saveTimes.slice(-100);
          const statsToSave = {
            ...this.state.statistics,
            saveTimes: recentSaveTimes,
          };
          localStorage.setItem(
            this.storageKeys.stats,
            JSON.stringify(statsToSave)
          );
        }
      } catch (error) {
        this.log('Error persisting state: ' + error.message, 'warn');
      }
    }

    /**
     * Set up multi-tab coordination
     */
    setupTabCoordination() {
      if (!this.config.enableTabCoordination || !window.BroadcastChannel) {
        return;
      }

      try {
        this.broadcastChannel = new BroadcastChannel('nightingale-autosave');
        this.broadcastChannel.addEventListener(
          'message',
          this.handleBroadcastMessage
        );

        // Register this tab
        this.broadcastTabMessage('tab-registered', {
          tabId: this.tabId,
          timestamp: Date.now(),
        });

        this.log('Tab coordination enabled', 'info');
      } catch (error) {
        this.log('Failed to set up tab coordination: ' + error.message, 'warn');
      }
    }

    /**
     * Handle messages from other tabs
     */
    handleBroadcastMessage(event) {
      const { type, tabId } = event.data;

      // Ignore messages from this tab
      if (tabId === this.tabId) return;

      switch (type) {
        case 'save-started':
          this.updateStatus(
            'other-tab-saving',
            `Save in progress in another tab`
          );
          break;
        case 'save-completed':
          this.updateStatus('other-tab-saved', `Another tab completed save`);
          // Check if we need to refresh our data
          this.handleCrossSave();
          break;
        case 'save-failed':
          // Other tab failed to save, we might need to take over
          this.log(
            'Another tab failed to save, checking if we should retry',
            'warn'
          );
          break;
      }
    }

    /**
     * Broadcast message to other tabs
     */
    broadcastTabMessage(type, data = {}) {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type,
          data,
          tabId: this.tabId,
          timestamp: Date.now(),
        });
      }
    }

    /**
     * Handle when another tab saves data
     */
    handleCrossSave() {
      // Reset our data hash to force a comparison on next change
      this.state.lastDataHash = null;
      this.log('Data potentially updated by another tab', 'info');
    }

    /**
     * Start permission watcher
     */
    startPermissionWatcher() {
      if (this.state.isPermissionWatcherActive || !this.fileService) {
        return;
      }

      this.state.isPermissionWatcherActive = true;
      this.permissionWatcherTimer = setInterval(
        this.checkPermissions,
        this.config.permissionCheckInterval
      );
      this.log('Permission watcher started', 'info');
    }

    /**
     * Stop permission watcher
     */
    stopPermissionWatcher() {
      if (this.permissionWatcherTimer) {
        clearInterval(this.permissionWatcherTimer);
        this.permissionWatcherTimer = null;
      }
      this.state.isPermissionWatcherActive = false;
    }

    /**
     * Check file system permissions
     */
    async checkPermissions() {
      try {
        if (!this.fileService || !this.fileService.checkPermission) {
          return;
        }

        const permission = await this.fileService.checkPermission();
        const previousStatus = this.state.permissionStatus;
        this.state.permissionStatus = permission;
        this.state.lastPermissionCheck = Date.now();

        // Handle permission state changes
        if (previousStatus !== permission) {
          await this.handlePermissionChange(previousStatus, permission);
        }
      } catch (error) {
        this.log('Error checking permissions: ' + error.message, 'warn');
        this.state.permissionStatus = 'unknown';
      }
    }

    /**
     * Handle permission status changes
     */
    async handlePermissionChange(previousStatus, newStatus) {
      // Handle initial state properly
      const prev = previousStatus || 'unknown';
      const current = newStatus || 'unknown';

      this.log(`Permission changed from ${prev} to ${current}`, 'info');

      switch (newStatus) {
        case 'granted':
          if (previousStatus === 'denied' || previousStatus === 'prompt') {
            this.updateStatus(
              'permission-restored',
              'File system access restored'
            );
            // Resume autosave if it was paused due to permissions
            if (!this.state.isEnabled && this.config.enabled) {
              this.resume();
            }
          }
          break;

        case 'denied':
          this.updateStatus('permission-lost', 'File system access denied', {
            userAction: 'Please reconnect to your save folder in settings',
          });
          // Pause autosave but don't fully stop it
          this.pause();
          break;

        case 'prompt':
          this.updateStatus(
            'permission-prompt',
            'File system access requires permission'
          );
          break;
      }
    }

    /**
     * Classify error and create appropriate AutosaveError
     */
    classifyError(error) {
      let errorType = ERROR_TYPES.UNKNOWN;

      if (
        error.name === 'NotAllowedError' ||
        error.message.includes('permission')
      ) {
        errorType = ERROR_TYPES.PERMISSION_DENIED;
      } else if (
        error.name === 'NetworkError' ||
        error.message.includes('network')
      ) {
        errorType = ERROR_TYPES.NETWORK_ERROR;
      } else if (
        error.message.includes('storage') ||
        error.message.includes('disk')
      ) {
        errorType = ERROR_TYPES.STORAGE_FULL;
      } else if (
        error.message.includes('locked') ||
        error.message.includes('busy')
      ) {
        errorType = ERROR_TYPES.FILE_LOCKED;
      }

      return new AutosaveError(
        error.message,
        errorType.type,
        errorType.recoverable,
        errorType.userAction
      );
    }

    /**
     * Record error statistics
     */
    recordError(error) {
      const errorType = error.type || 'unknown';
      if (!this.state.statistics.errorsByType[errorType]) {
        this.state.statistics.errorsByType[errorType] = 0;
      }
      this.state.statistics.errorsByType[errorType]++;
      this.persistState();
    }

    /**
     * Initialize the autosave service with enhanced features
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

      // Set up enhanced features
      this.setupEventListeners();
      this.setupTabCoordination();
      this.startPermissionWatcher();

      // Start autosave if enabled
      if (this.state.isEnabled) {
        this.start();
      }

      this.log('AutosaveService v2.0 initialized', 'info');
      this.updateStatus('initialized', 'Enhanced autosave service initialized');
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
     * Perform the actual save operation with enhanced error handling
     * @param {Object} options - Save options
     * @param {boolean} options.force - Force save even if no changes detected
     * @returns {Promise<boolean>} - Save success status
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
        // Check directory permissions first
        const hasPermissions = await this.checkPermissions();
        if (!hasPermissions) {
          throw new AutosaveError(
            'Insufficient permissions to write to directory',
            ERROR_TYPES.PERMISSION_DENIED,
            { directory: this.config.saveDirectory }
          );
        }

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
          throw new AutosaveError(
            'No data available to save',
            ERROR_TYPES.DATA_ERROR,
            { dataProvider: typeof this.dataProvider }
          );
        }

        // Perform the save with proper error classification
        const success = await this.fileService.writeFile(data);

        if (success) {
          // Save successful
          const saveTime = Date.now();
          const duration = saveTime - startTime;

          this.state.lastSaveTime = saveTime;
          this.state.lastSuccessfulSave = saveTime;
          this.state.consecutiveFailures = 0;
          this.state.statistics.successfulSaves++;
          this.state.statistics.totalSaveTime += duration;

          // Update average save time
          this.state.statistics.averageSaveTime =
            this.state.statistics.totalSaveTime /
            this.state.statistics.successfulSaves;

          // Broadcast save to other tabs
          this.broadcastTabMessage('save-completed', {
            timestamp: saveTime,
            statistics: {
              duration,
              dataSize: JSON.stringify(data).length,
            },
          });

          this.updateStatus('saved', `Data saved successfully (${duration}ms)`);
          this.log('Save completed successfully', 'info', {
            duration,
            saveTime,
          });

          // Persist updated statistics
          this.persistState();

          return true;
        } else {
          throw new AutosaveError(
            'FileService returned false - save operation failed',
            ERROR_TYPES.WRITE_ERROR,
            { fileService: this.fileService.constructor.name }
          );
        }
      } catch (error) {
        // Enhanced error handling with classification
        this.state.consecutiveFailures++;
        this.state.statistics.failedSaves++;

        let autosaveError;
        if (error instanceof AutosaveError) {
          autosaveError = error;
        } else {
          // Classify the error type
          let errorType = ERROR_TYPES.UNKNOWN;
          if (
            error.name === 'NotAllowedError' ||
            error.message.includes('permission')
          ) {
            errorType = ERROR_TYPES.PERMISSION_DENIED;
          } else if (error.name === 'QuotaExceededError') {
            errorType = ERROR_TYPES.QUOTA_EXCEEDED;
          } else if (error.name === 'NetworkError') {
            errorType = ERROR_TYPES.NETWORK_ERROR;
          }

          autosaveError = new AutosaveError(error.message, errorType, {
            originalError: error.name,
            stack: error.stack,
          });
        }

        const duration = Date.now() - startTime;
        this.log('Save operation failed', 'error', {
          error: autosaveError.message,
          type: autosaveError.type,
          duration,
          consecutiveFailures: this.state.consecutiveFailures,
          context: autosaveError.context,
        });

        // Broadcast error to other tabs
        this.broadcastTabMessage('save-failed', {
          error: {
            message: autosaveError.message,
            type: autosaveError.type,
            context: autosaveError.context,
          },
        });

        this.updateStatus('error', `Save failed: ${autosaveError.message}`);

        // Schedule retry based on error type and consecutive failures
        this.scheduleRetry(autosaveError);

        return false;
      } finally {
        this.state.saveInProgress = false;

        // Check for pending save request
        if (this.state.pendingSave) {
          this.state.pendingSave = false;
          setTimeout(() => {
            this.debouncedSave();
          }, this.config.debounceDelay);
        }
      }
    }

    /**
     * Schedule retry based on error type and consecutive failures
     * @param {AutosaveError} error - The error that occurred
     */
    scheduleRetry(error) {
      // Don't retry for certain error types
      if (
        error.type === ERROR_TYPES.PERMISSION_DENIED &&
        this.state.consecutiveFailures > 3
      ) {
        this.log('Too many permission errors - disabling autosave', 'warn');
        this.stop();
        return;
      }

      // Calculate retry delay based on consecutive failures (exponential backoff)
      const baseDelay = this.config.retryDelay;
      const maxDelay = this.config.maxRetryDelay;
      const delay = Math.min(
        baseDelay * Math.pow(2, this.state.consecutiveFailures - 1),
        maxDelay
      );

      this.log(`Scheduling retry in ${delay}ms`, 'debug', {
        consecutiveFailures: this.state.consecutiveFailures,
        errorType: error.type,
      });

      this.retryTimer = setTimeout(() => {
        this.saveNow({ force: true });
      }, delay);
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
          if (data !== null) {
            console.error(logMessage, data);
          } else {
            console.error(logMessage);
          }
          break;
        case 'warn':
          if (data !== null) {
            console.warn(logMessage, data);
          } else {
            console.warn(logMessage);
          }
          break;
        case 'debug':
          if (console.debug) {
            if (data !== null) {
              console.debug(logMessage, data);
            } else {
              console.debug(logMessage);
            }
          }
          break;
        default:
          if (data !== null) {
            console.log(logMessage, data);
          } else {
            console.log(logMessage);
          }
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
