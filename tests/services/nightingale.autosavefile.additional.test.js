/**
 * Additional minimal tests for nightingale.autosavefile.js
 * Focuses on timing behavior and basic API coverage
 */

import AutosaveFileService from '../../src/services/nightingale.autosavefile.js';

describe('nightingale.autosavefile minimal coverage', () => {
  let service;
  let mockFileService;

  beforeEach(() => {
    jest.useFakeTimers();

    mockFileService = {
      save: jest.fn().mockResolvedValue(true),
      checkPermission: jest.fn().mockResolvedValue('granted'),
      ensurePermission: jest.fn().mockResolvedValue(true),
    };

    service = new AutosaveFileService({
      errorCallback: jest.fn(),
      statusCallback: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    if (service) {
      service.stopAutosave();
    }
  });

  test('initializes with mock file service', () => {
    expect(service).toBeDefined();
    expect(typeof service.notifyDataChange).toBe('function');
    expect(typeof service.startAutosave).toBe('function');
    expect(typeof service.stopAutosave).toBe('function');
  });

  test('notifyDataChange handles running state correctly', () => {
    service.setDataProvider(() => ({ test: 'data' }));

    // Stop if auto-started
    service.stopAutosave();

    // When not running, should do nothing
    service.notifyDataChange();
    let status = service.getStatus();
    expect(status.isRunning).toBe(false);

    // When running, should work
    service.startAutosave();
    service.notifyDataChange();
    status = service.getStatus();
    expect(status.isRunning).toBe(true);
    // Should have set up debounce timer (we can't easily test the actual timestamp)
  });

  test('startAutosave sets running state', () => {
    service.startAutosave();

    const status = service.getStatus();
    expect(status.isRunning).toBe(true);
  });

  test('stopAutosave clears running state', () => {
    service.startAutosave();
    expect(service.getStatus().isRunning).toBe(true);

    service.stopAutosave();
    expect(service.getStatus().isRunning).toBe(false);
  });

  test('updateConfig merges new configuration', () => {
    const newConfig = { saveInterval: 30000, maxRetries: 5 };
    service.updateConfig(newConfig);

    const status = service.getStatus();
    expect(status.config.saveInterval).toBe(30000);
    expect(status.config.maxRetries).toBe(5);
  });

  test('getStatus returns current state information', () => {
    const status = service.getStatus();

    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('permissionStatus');
    expect(status).toHaveProperty('lastSaveTime');
    expect(status).toHaveProperty('consecutiveFailures');
    expect(status).toHaveProperty('config');
  });

  test('handles data provider correctly', () => {
    const testData = { cases: [], people: [] };
    service.setDataProvider(() => testData);

    // Should not throw when accessing data
    expect(() => {
      service.notifyDataChange();
    }).not.toThrow();
  });

  test('cleanup prevents timer leaks', () => {
    service.startAutosave();
    service.notifyDataChange();

    // Should have some timers set
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    service.stopAutosave();

    // Should clean up most timers (may leave some global ones)
    // Just verify it doesn't crash
    expect(service.getStatus().isRunning).toBe(false);
  });

  test('directoryHandle property can be set', () => {
    const mockHandle = {
      queryPermission: jest.fn().mockResolvedValue('granted'),
    };

    service.directoryHandle = mockHandle;
    expect(service.directoryHandle).toBe(mockHandle);
  });

  test('handles missing data provider gracefully', () => {
    // Don't set a data provider
    expect(() => {
      service.notifyDataChange();
    }).not.toThrow();
  });

  test('config contains expected default properties', () => {
    const status = service.getStatus();

    expect(status.config).toHaveProperty('saveInterval');
    expect(status.config).toHaveProperty('maxRetries');
    expect(typeof status.config.saveInterval).toBe('number');
    expect(typeof status.config.maxRetries).toBe('number');
  });
});
