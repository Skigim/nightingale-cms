/**
 * Nightingale CMS Combined Autosave & File Service v1.0
 *
 * Combines file system operations with autosave functionality to eliminate
 * service coordination complexity and timing issues.
 *
 * Features:
 * - File System Access API with IndexedDB persistence
 * - Intelligent autosave with permission awareness
 * - Single service initialization (no dependency injection)
 * - Graceful degradation when permissions unavailable
 * - Multi-tab coordination and conflict resolution
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

// TODO: Replace with proper imports once logger and datamanagement are modernized
// import NightingaleLogger from './nightingale.logger.js';
// import NightingaleDataManagement from './nightingale.datamanagement.js';

/**
 * Combined Autosave and File Service
 * Handles both file operations and automatic saving
 */
class AutosaveFileService {
  constructor({
    fileName = 'nightingale-data.json',
    errorCallback = () => {},
    sanitizeFn = (str) => str,
    tabId = null,

    // Autosave configuration
    enabled = true,
    saveInterval = 120000, // 2 minutes
    debounceDelay = 5000, // 5 seconds
    maxRetries = 3,

    // Service callbacks
    statusCallback = null,
  } = {}) {
    // File service properties
    this.directoryHandle = null;
    this.fileName = fileName;
    this.errorCallback = errorCallback;
    this.sanitizeFn = sanitizeFn;
    this.tabId = tabId || `cms-tab-${Date.now()}`;
    this.dbName = 'NightingaleFileAccess';
    this.storeName = 'directoryHandles';
    this.dbKey = 'nightingaleDirectory';

    // Write operation queue to prevent race conditions
    this.writeQueue = [];
    this.isWriting = false;

    // Autosave properties
    this.config = {
      enabled,
      saveInterval,
      debounceDelay,
      maxRetries,
    };

    this.state = {
      isRunning: false,
      permissionStatus: 'unknown',
      lastSaveTime: null,
      lastDataChange: null,
      consecutiveFailures: 0,
      pendingSave: false,
    };

    this.statusCallback = statusCallback;
    this.dataProvider = null;
    this.timers = {
      saveInterval: null,
      debounceTimeout: null,
      permissionCheck: null,
    };

    // Auto-initialize
    this.initialize();
  }

  /**
   * Initialize the combined service
   */
  async initialize() {
    try {
      // Try to restore previous directory access
      await this.restoreLastDirectoryAccess();

      // Start autosave if enabled
      if (this.config.enabled) {
        this.startAutosave();
      }

      this.updateStatus('initialized', 'Service ready');
    } catch (error) {
      const logger = globalThis.NightingaleLogger?.get('autosave:init');
      logger?.error('Autosave init failed', { error: error.message });
      this.updateStatus('error', 'Initialization failed: ' + error.message);
    }
  }

  // =============================================================================
  // FILE SYSTEM OPERATIONS
  // =============================================================================

  isSupported() {
    return 'showDirectoryPicker' in window;
  }

  async connect() {
    if (!this.isSupported()) {
      this.errorCallback(
        'File System Access API is not supported in this browser.',
        'error',
      );
      return false;
    }

    try {
      this.directoryHandle = await window.showDirectoryPicker();
      const permissionGranted = await this.requestPermission();

      if (permissionGranted) {
        await this.storeDirectoryHandle();
        this.state.permissionStatus = 'granted';
        this.updateStatus('connected', 'Connected to data folder');

        // Start autosave if not already running
        if (this.config.enabled && !this.state.isRunning) {
          this.startAutosave();
        }
      }

      return permissionGranted;
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.updateStatus('error', 'Failed to connect to folder');
      }
      return false;
    }
  }

  async checkPermission() {
    if (!this.directoryHandle) return 'prompt';
    return await this.directoryHandle.queryPermission({ mode: 'readwrite' });
  }

  async requestPermission() {
    if (!this.directoryHandle) return false;

    const permission = await this.directoryHandle.requestPermission({
      mode: 'readwrite',
    });
    if (permission === 'granted') {
      return true;
    }

    this.errorCallback('Permission denied for the directory.', 'error');
    return false;
  }

  async writeFile(data) {
    // Add to write queue to prevent race conditions
    return new Promise((resolve, reject) => {
      this.writeQueue.push({ data, resolve, reject });
      this.processWriteQueue();
    });
  }

  async processWriteQueue() {
    // If already processing or queue is empty, return
    if (this.isWriting || this.writeQueue.length === 0) {
      return;
    }

    this.isWriting = true;

    try {
      while (this.writeQueue.length > 0) {
        const { data, resolve, reject } = this.writeQueue.shift();

        try {
          const success = await this._performWrite(data);
          resolve(success);
        } catch (error) {
          const logger = globalThis.NightingaleLogger?.get('autosave:write');
          logger?.error('Write operation failed', { error: error.message });
          reject(error);
        }
      }
    } finally {
      this.isWriting = false;
    }
  }

  async _performWrite(data) {
    // Check if we have a directory handle and permissions
    if (!this.directoryHandle) {
      return false;
    }

    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      return false;
    }

    try {
      const fileHandleWrite = await this.directoryHandle.getFileHandle(
        this.fileName,
        { create: true },
      );
      const writable = await fileHandleWrite.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      // Store last save timestamp
      localStorage.setItem(
        'nightingale-last-save',
        JSON.stringify({
          timestamp: Date.now(),
          tabId: this.tabId,
        }),
      );

      return true;
    } catch (err) {
      this.errorCallback(
        `Error writing file "${this.fileName}": ${err.message}`,
        'error',
      );
      return false;
    }
  }

  /**
   * Write JSON data to an arbitrary file name in the connected directory.
   * Returns true on success, false otherwise.
   */
  async writeNamedFile(fileName, data) {
    if (!this.directoryHandle) {
      return false;
    }

    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      return false;
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) {
      this.errorCallback(
        `Error writing file "${fileName}": ${err.message}`,
        'error',
      );
      return false;
    }
  }

  /**
   * Create a timestamped backup file, then write to the primary file.
   * Returns { backupCreated, written, backupName }.
   */
  async backupAndWrite(data) {
    const ts = new Date().toISOString().replace(/[:]/g, '-');
    const backupName = `nightingale-data.backup-${ts}.json`;

    const backupCreated = await this.writeNamedFile(backupName, data);
    const written = await this._performWrite(data);
    return { backupCreated, written, backupName };
  }

  async readFile() {
    if (!this.directoryHandle) {
      return null;
    }

    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      return null;
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(
        this.fileName,
      );
      const file = await fileHandle.getFile();
      const contents = await file.text();
      const rawData = JSON.parse(contents);

      // Apply data migrations if available
      if (globalThis.NightingaleDataManagement?.normalizeDataMigrations) {
        const migratedData =
          await globalThis.NightingaleDataManagement.normalizeDataMigrations(
            rawData,
          );
        return migratedData;
      } else {
        return rawData;
      }
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return null;
      } else {
        this.errorCallback(
          `Error reading file "${this.fileName}": ${err.message}`,
          'error',
        );
        throw err;
      }
    }
  }

  async restoreLastDirectoryAccess() {
    if (!this.isSupported()) {
      this.state.permissionStatus = 'unsupported';
      return { handle: null, permission: 'unsupported' };
    }

    try {
      const handle = await this.getStoredDirectoryHandle();
      if (handle) {
        this.directoryHandle = handle;
        const permission = await this.checkPermission();
        this.state.permissionStatus = permission;

        if (permission === 'granted') {
          this.updateStatus('connected', 'Restored connection to data folder');
        } else {
          this.updateStatus(
            'disconnected',
            'Please reconnect to your data folder',
          );
        }

        return { handle, permission };
      }
    } catch (error) {
      const logger = globalThis.NightingaleLogger?.get('autosave:directory');
      logger?.warn('Directory handle verification failed', {
        error: error.message,
      });
      await this.clearStoredDirectoryHandle();
    }

    this.state.permissionStatus = 'prompt';
    this.updateStatus('disconnected', 'No data folder connected');
    return { handle: null, permission: 'prompt' };
  }

  // IndexedDB operations for directory handle persistence
  async getStoredDirectoryHandle() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          resolve(null);
          return;
        }
        const getRequest = db
          .transaction(this.storeName)
          .objectStore(this.storeName)
          .get(this.dbKey);
        getRequest.onsuccess = () => resolve(getRequest.result?.handle || null);
        getRequest.onerror = () => resolve(null);
      };
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(this.storeName);
      };
    });
  }

  async storeDirectoryHandle() {
    if (!this.directoryHandle) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = (e) => reject(e);
      request.onsuccess = () => {
        const db = request.result;
        const putRequest = db
          .transaction(this.storeName, 'readwrite')
          .objectStore(this.storeName)
          .put({ handle: this.directoryHandle }, this.dbKey);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (e) => reject(e);
      };
    });
  }

  async clearStoredDirectoryHandle() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          resolve();
          return;
        }
        const deleteRequest = db
          .transaction(this.storeName, 'readwrite')
          .objectStore(this.storeName)
          .delete(this.dbKey);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve();
      };
      request.onerror = () => resolve();
    });
  }

  // =============================================================================
  // AUTOSAVE OPERATIONS
  // =============================================================================

  /**
   * Set the data provider function (allows dynamic updates)
   */
  setDataProvider(dataProvider) {
    this.dataProvider = dataProvider;
  }

  /**
   * Update the data provider with current data reference
   */
  updateDataProvider(getCurrentData) {
    this.dataProvider = () => {
      const data = getCurrentData();
      if (!data) {
        return null;
      }
      return data;
    };
  }

  /**
   * Initialize with React state integration
   * This method handles the common React pattern of passing a state getter
   */
  initializeWithReactState(getFullData, statusCallback = null) {
    // Store the data getter for future updates
    this.getFullData = getFullData;

    // Set up data provider that always gets current state
    this.dataProvider = () => {
      const data = this.getFullData();
      if (!data) {
        return null;
      }
      return data;
    };

    // Set up status callback if provided
    if (statusCallback) {
      this.statusCallback = statusCallback;
    }

    return this;
  }

  /**
   * Update the React data getter (for when state reference changes)
   */
  updateReactState(getFullData) {
    if (this.getFullData) {
      this.getFullData = getFullData;
    }
  }

  /**
   * Start the autosave service
   */
  startAutosave() {
    if (this.state.isRunning) {
      return;
    }

    this.state.isRunning = true;

    // Start periodic save interval
    this.timers.saveInterval = setInterval(() => {
      this.performAutosave('interval');
    }, this.config.saveInterval);

    // Start permission checking
    this.timers.permissionCheck = setInterval(() => {
      this.checkPermissions();
    }, 30000); // Check every 30 seconds

    this.updateStatus('running', 'Autosave active');
  }

  /**
   * Stop the autosave service
   */
  stopAutosave() {
    this.state.isRunning = false;

    // Clear all timers
    if (this.timers.saveInterval) {
      clearInterval(this.timers.saveInterval);
      this.timers.saveInterval = null;
    }

    if (this.timers.debounceTimeout) {
      clearTimeout(this.timers.debounceTimeout);
      this.timers.debounceTimeout = null;
    }

    if (this.timers.permissionCheck) {
      clearInterval(this.timers.permissionCheck);
      this.timers.permissionCheck = null;
    }

    this.updateStatus('stopped', 'Autosave stopped');
  }

  /**
   * Notify that data has changed (for debounced saves)
   */
  notifyDataChange() {
    if (!this.state.isRunning) return;

    this.state.lastDataChange = Date.now();

    // Clear existing debounce timeout
    if (this.timers.debounceTimeout) {
      clearTimeout(this.timers.debounceTimeout);
    }

    // Set new debounced save
    this.timers.debounceTimeout = setTimeout(() => {
      this.performAutosave('change');
    }, this.config.debounceDelay);
  }

  /**
   * Perform an autosave operation
   */
  async performAutosave() {
    if (!this.state.isRunning || this.state.pendingSave) {
      return;
    }

    // Check if we have a data provider
    if (!this.dataProvider) {
      return;
    }

    // Check permissions
    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      this.updateStatus('waiting', 'Waiting for folder connection');
      return;
    }

    try {
      this.state.pendingSave = true;
      this.updateStatus('saving', 'Saving...');

      // Get current data with debugging
      const data = this.dataProvider();

      if (!data) {
        this.updateStatus('error', 'No data available to save');
        return;
      }

      // Perform the save
      const success = await this.writeFile(data);

      if (success) {
        this.state.lastSaveTime = Date.now();
        this.state.consecutiveFailures = 0;
        this.updateStatus(
          'saved',
          `Last saved: ${new Date().toLocaleTimeString()}`,
        );
      } else {
        this.handleSaveFailure('Write operation failed');
      }
    } catch (error) {
      const logger = globalThis.NightingaleLogger?.get('autosave:save');
      logger?.error('Save operation failed', { error: error.message });
      this.handleSaveFailure(error.message);
    } finally {
      this.state.pendingSave = false;
    }
  }

  /**
   * Handle save failures with retry logic
   */
  handleSaveFailure(errorMessage) {
    this.state.consecutiveFailures++;

    if (this.state.consecutiveFailures >= this.config.maxRetries) {
      this.updateStatus('error', `Save failed: ${errorMessage}`);
      // Stop trying for a while
      setTimeout(() => {
        this.state.consecutiveFailures = 0;
      }, 60000); // Reset after 1 minute
    } else {
      this.updateStatus(
        'retrying',
        `Retrying save (${this.state.consecutiveFailures}/${this.config.maxRetries})`,
      );

      // Retry after a delay
      setTimeout(() => {
        this.performAutosave('retry');
      }, 5000 * this.state.consecutiveFailures); // Exponential backoff
    }
  }

  /**
   * Check permissions and update status
   */
  async checkPermissions() {
    try {
      const permission = await this.checkPermission();
      const previousStatus = this.state.permissionStatus;
      this.state.permissionStatus = permission;

      if (previousStatus !== permission) {
        if (
          permission === 'granted' &&
          this.config.enabled &&
          !this.state.isRunning
        ) {
          this.startAutosave();
        } else if (permission !== 'granted' && this.state.isRunning) {
          this.updateStatus('waiting', 'Waiting for folder permissions');
        }
      }
    } catch (error) {
      const logger = globalThis.NightingaleLogger?.get('autosave:permissions');
      logger?.debug('Permission check failed', { error: error.message });
      this.state.permissionStatus = 'unknown';
    }
  }

  /**
   * Update status and notify callback
   */
  updateStatus(status, message) {
    const statusObj = {
      status,
      message,
      timestamp: Date.now(),
      permissionStatus: this.state.permissionStatus,
      lastSaveTime: this.state.lastSaveTime,
      consecutiveFailures: this.state.consecutiveFailures,
    };

    if (this.statusCallback) {
      this.statusCallback(statusObj);
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Manual save operation
   */
  async save() {
    return this.performAutosave('manual');
  }

  /**
   * Get current service status
   */
  getStatus() {
    return {
      isRunning: this.state.isRunning,
      permissionStatus: this.state.permissionStatus,
      lastSaveTime: this.state.lastSaveTime,
      consecutiveFailures: this.state.consecutiveFailures,
      config: { ...this.config },
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Restart autosave if interval changed
    if (this.state.isRunning && newConfig.saveInterval) {
      this.stopAutosave();
      this.startAutosave();
    }
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    this.stopAutosave();
    this.dataProvider = null;
    this.statusCallback = null;
  }

  /**
   * Static factory method for React integration
   * Creates and configures service for typical React use case
   */
  static createForReact({
    fileName = 'nightingale-data.json',
    errorCallback = () => {},
    sanitizeFn = (str) => str,
    tabId = null,

    // Autosave configuration
    enabled = true,
    saveInterval = 120000, // 2 minutes
    debounceDelay = 5000, // 5 seconds
    maxRetries = 3,

    // React integration
    getFullData,
    statusCallback = null,
  } = {}) {
    const service = new AutosaveFileService({
      fileName,
      errorCallback,
      sanitizeFn,
      tabId,
      enabled,
      saveInterval,
      debounceDelay,
      maxRetries,
      statusCallback,
    });

    // Set up React state integration
    if (getFullData) {
      service.initializeWithReactState(getFullData, statusCallback);
    }

    return service;
  }
}

// ES6 Module Export
export default AutosaveFileService;
