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
    test('should start and stop autosave', async () => {
      // Mock timers
      jest.useFakeTimers();

      // Ensure permission is treated as granted for this test
      service.directoryHandle = {
        queryPermission: jest.fn(() => Promise.resolve('granted')),
      };

      service.startAutosave();
      // Wait microtasks for permission check chain
      await Promise.resolve();
      await Promise.resolve();
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

    test('performAutosave handles missing permission gracefully', async () => {
      service.setDataProvider(() => ({ a: 1 }));
      service.state.isRunning = true;
      // mock permission denied
      service.checkPermission = jest.fn(() => Promise.resolve('denied'));
      await service.performAutosave();
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'waiting' }),
      );
    });

    test('performAutosave handles write failure path', async () => {
      // Arrange
      service.setDataProvider(() => ({ a: 1 }));
      service.state.isRunning = true;
      service.checkPermission = jest.fn(() => Promise.resolve('granted'));
      // Force writeFile to return false
      service.writeFile = jest.fn(() => Promise.resolve(false));
      await service.performAutosave();
      // Should have transitioned through retrying state
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'retrying' }),
      );
    });

    test('performAutosave success resets consecutiveFailures', async () => {
      service.setDataProvider(() => ({ a: 1 }));
      service.state.isRunning = true;
      service.state.consecutiveFailures = 2;
      service.checkPermission = jest.fn(() => Promise.resolve('granted'));
      service.writeFile = jest.fn(() => Promise.resolve(true));
      await service.performAutosave();
      expect(service.state.consecutiveFailures).toBe(0);
      expect(mockStatusCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'saved' }),
      );
    });
  });

  describe('Backup Operations', () => {
    test('backupAndWrite returns success object when both operations succeed', async () => {
      service.directoryHandle = {
        // minimal handle to satisfy _performWrite path
        getFileHandle: jest.fn(() => ({
          createWritable: jest.fn(() => ({
            write: jest.fn(),
            close: jest.fn(),
          })),
        })),
        queryPermission: jest.fn(() => Promise.resolve('granted')),
      };
      // Spy on internal helpers
      const writeNamedSpy = jest
        .spyOn(service, 'writeNamedFile')
        .mockResolvedValue(true);
      const performWriteSpy = jest
        .spyOn(service, '_performWrite')
        .mockResolvedValue(true);

      const data = { x: 1 };
      const result = await service.backupAndWrite(data);

      expect(writeNamedSpy).toHaveBeenCalledTimes(1);
      expect(performWriteSpy).toHaveBeenCalledWith(data);
      expect(result.backupCreated).toBe(true);
      expect(result.written).toBe(true);
      expect(result.backupName).toMatch(/nightingale-data.backup-/);
    });

    test('backupAndWrite reflects backup failure but write success', async () => {
      service.directoryHandle = {
        getFileHandle: jest.fn(() => ({
          createWritable: jest.fn(() => ({
            write: jest.fn(),
            close: jest.fn(),
          })),
        })),
        queryPermission: jest.fn(() => Promise.resolve('granted')),
      };
      const writeNamedSpy = jest
        .spyOn(service, 'writeNamedFile')
        .mockResolvedValue(false);
      const performWriteSpy = jest
        .spyOn(service, '_performWrite')
        .mockResolvedValue(true);

      const result = await service.backupAndWrite({ y: 2 });

      expect(writeNamedSpy).toHaveBeenCalled();
      expect(performWriteSpy).toHaveBeenCalled();
      expect(result.backupCreated).toBe(false);
      expect(result.written).toBe(true);
    });
  });

  describe('Restore Flow', () => {
    test('restoreLastDirectoryAccess updates status when permission granted', async () => {
      const mockHandle = {
        queryPermission: jest.fn(() => Promise.resolve('granted')),
      };
      // Force support
      jest.spyOn(service, 'isSupported').mockReturnValue(true);

      const getRequest = { onsuccess: null, onerror: null, result: null };
      const originalOpen = global.indexedDB.open;
      global.indexedDB.open = jest.fn(() => {
        const openReq = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          result: {
            objectStoreNames: { contains: jest.fn(() => true) },
            transaction: jest.fn(() => ({
              objectStore: jest.fn(() => ({
                get: jest.fn(() => getRequest),
              })),
            })),
          },
        };
        setTimeout(() => {
          if (openReq.onsuccess) {
            openReq.onsuccess();
            getRequest.result = { handle: mockHandle };
            if (getRequest.onsuccess) getRequest.onsuccess();
          }
        }, 0);
        return openReq;
      });

      const res = await service.restoreLastDirectoryAccess();
      // Allow queued setTimeout callbacks to run
      await new Promise((r) => setTimeout(r, 5));

      expect(res.handle).toBe(mockHandle);
      expect(service.state.permissionStatus).toBe('granted');
      const connectedCall = mockStatusCallback.mock.calls.find(
        (c) => c[0].status === 'connected',
      );
      expect(connectedCall).toBeDefined();

      global.indexedDB.open = originalOpen;
    });
  });

  describe('Write Queue', () => {
    test('processes multiple writeFile calls sequentially', async () => {
      service.directoryHandle = {
        queryPermission: jest.fn(() => Promise.resolve('granted')),
      };
      const performWriteOrder = [];
      jest
        .spyOn(service, '_performWrite')
        .mockImplementation(async (payload) => {
          performWriteOrder.push(payload.id);
          // simulate small async delay
          await new Promise((r) => setTimeout(r, 5));
          return true;
        });

      const writes = [1, 2, 3, 4, 5].map((id) => service.writeFile({ id }));
      await Promise.all(writes);

      expect(performWriteOrder).toEqual([1, 2, 3, 4, 5]);
      expect(service.writeQueue.length).toBe(0);
      expect(service.isWriting).toBe(false);
    });
  });
});
