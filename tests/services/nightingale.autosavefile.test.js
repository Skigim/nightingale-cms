/**
 * Tests for Nightingale Autosave File Service
 */

import AutosaveFileService from '../../src/services/nightingale.autosavefile.js';

// Mock global dependencies
global.indexedDB = {
  open: jest.fn(() => ({
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: {
      objectStoreNames: {
        contains: jest.fn(() => false),
      },
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn(() => ({ onsuccess: null, onerror: null })),
          put: jest.fn(() => ({ onsuccess: null, onerror: null })),
          delete: jest.fn(() => ({ onsuccess: null, onerror: null })),
        })),
      })),
    },
  })),
};

global.showDirectoryPicker = jest.fn();

// Mock window dependencies
global.window = {
  ...global.window,
  NightingaleLogger: {
    get: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
  NightingaleDataManagement: {
    normalizeDataMigrations: jest.fn((data) => data),
  },
  showDirectoryPicker: global.showDirectoryPicker,
};

describe('AutosaveFileService', () => {
  let service;
  let mockErrorCallback;
  let mockStatusCallback;

  beforeEach(() => {
    mockErrorCallback = jest.fn();
    mockStatusCallback = jest.fn();

    service = new AutosaveFileService({
      errorCallback: mockErrorCallback,
      statusCallback: mockStatusCallback,
      enabled: false, // Disable autosave for testing
    });
  });

  afterEach(() => {
    if (service) {
      service.destroy();
    }
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create service with default configuration', () => {
      const newService = new AutosaveFileService();
      expect(newService).toBeInstanceOf(AutosaveFileService);
      expect(newService.fileName).toBe('nightingale-data.json');
      expect(newService.config.enabled).toBe(true);
      expect(newService.config.saveInterval).toBe(120000);
      newService.destroy();
    });

    test('should create service with custom configuration', () => {
      const customService = new AutosaveFileService({
        fileName: 'custom-data.json',
        saveInterval: 60000,
        enabled: false,
      });

      expect(customService.fileName).toBe('custom-data.json');
      expect(customService.config.saveInterval).toBe(60000);
      expect(customService.config.enabled).toBe(false);
      customService.destroy();
    });
  });

  describe('File System Support', () => {
    test('should detect if File System Access API is supported', () => {
      // Mock supported browser
      global.showDirectoryPicker = jest.fn();
      expect(service.isSupported()).toBe(true);

      // Mock unsupported browser
      delete global.showDirectoryPicker;
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('Data Provider Management', () => {
    test('should set and use data provider', () => {
      const mockData = { test: 'data' };
      const dataProvider = jest.fn(() => mockData);

      service.setDataProvider(dataProvider);
      expect(service.dataProvider).toBe(dataProvider);
    });

    test('should create React state integration', () => {
      const mockData = { cases: [], people: [] };
      const getFullData = jest.fn(() => mockData);

      const reactService = AutosaveFileService.createForReact({
        getFullData,
        enabled: false,
      });

      expect(reactService).toBeInstanceOf(AutosaveFileService);
      expect(reactService.dataProvider).toBeDefined();
      expect(reactService.dataProvider()).toBe(mockData);

      reactService.destroy();
    });
  });

  describe('Status Management', () => {
    test('should update status and notify callback', () => {
      // Clear the initial call from constructor
      mockStatusCallback.mockClear();

      service.updateStatus('test', 'Test message');

      expect(mockStatusCallback).toHaveBeenCalledWith({
        status: 'test',
        message: 'Test message',
        timestamp: expect.any(Number),
        permissionStatus: 'unsupported', // Will be 'unsupported' in test environment
        lastSaveTime: null,
        consecutiveFailures: 0,
      });
    });

    test('should get current status', () => {
      const status = service.getStatus();

      expect(status).toEqual({
        isRunning: false,
        permissionStatus: 'unsupported', // Will be 'unsupported' in test environment
        lastSaveTime: null,
        consecutiveFailures: 0,
        config: service.config,
      });
    });
  });

  describe('Autosave Lifecycle', () => {
    test('should start and stop autosave', () => {
      // Mock timers
      jest.useFakeTimers();

      service.startAutosave();
      expect(service.state.isRunning).toBe(true);
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'running',
          message: 'Autosave active',
        }),
      );

      service.stopAutosave();
      expect(service.state.isRunning).toBe(false);
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'stopped',
          message: 'Autosave stopped',
        }),
      );

      jest.useRealTimers();
    });

    test('should notify data changes with debouncing', () => {
      jest.useFakeTimers();

      service.startAutosave();
      service.notifyDataChange();

      expect(service.state.lastDataChange).toBeDefined();
      expect(service.timers.debounceTimeout).toBeDefined();

      jest.useRealTimers();
      service.stopAutosave();
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      const newConfig = { saveInterval: 30000, maxRetries: 5 };
      service.updateConfig(newConfig);

      expect(service.config.saveInterval).toBe(30000);
      expect(service.config.maxRetries).toBe(5);
    });
  });

  describe('Service Cleanup', () => {
    test('should cleanup service on destroy', () => {
      service.setDataProvider(() => ({ test: 'data' }));
      service.statusCallback = mockStatusCallback;

      service.destroy();

      expect(service.dataProvider).toBeNull();
      expect(service.statusCallback).toBeNull();
      expect(service.state.isRunning).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle save failures with retry logic', () => {
      service.state.consecutiveFailures = 0;
      service.config.maxRetries = 3;

      service.handleSaveFailure('Test error');

      expect(service.state.consecutiveFailures).toBe(1);
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'retrying',
          message: 'Retrying save (1/3)',
        }),
      );
    });

    test('should stop retrying after max failures', () => {
      service.state.consecutiveFailures = 2;
      service.config.maxRetries = 3;

      service.handleSaveFailure('Test error');

      expect(service.state.consecutiveFailures).toBe(3);
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Save failed: Test error',
        }),
      );
    });
  });
});
