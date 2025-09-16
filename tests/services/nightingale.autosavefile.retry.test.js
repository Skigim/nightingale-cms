/**
 * Focused test on AutosaveFileService retry scheduling logic.
 */
import AutosaveFileService from '../../src/services/nightingale.autosavefile.js';

// Minimal indexedDB mock to satisfy constructor path
beforeAll(() => {
  global.indexedDB = {
    open: jest.fn(() => ({
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        objectStoreNames: { contains: jest.fn(() => false) },
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
});

describe('AutosaveFileService retry backoff', () => {
  let service;
  let statusEvents;

  beforeEach(() => {
    jest.useFakeTimers();
    statusEvents = [];
    service = new AutosaveFileService({
      enabled: false, // disable auto loops
      statusCallback: (s) => statusEvents.push(s),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    service.destroy();
  });

  test('handleSaveFailure schedules incremental retry delays', () => {
    const performSpy = jest
      .spyOn(service, 'performAutosave')
      .mockImplementation(() => {});

    service.config.maxRetries = 5;
    expect(service.state.consecutiveFailures).toBe(0);

    service.handleSaveFailure('x'); // 1st failure
    expect(service.state.consecutiveFailures).toBe(1);
    // Fast-forward first backoff 5000ms
    jest.advanceTimersByTime(5000);
    expect(performSpy).toHaveBeenCalledTimes(1);

    service.handleSaveFailure('x'); // 2nd failure
    jest.advanceTimersByTime(10000); // 2 * 5000
    expect(performSpy).toHaveBeenCalledTimes(2);

    service.handleSaveFailure('x'); // 3rd failure
    jest.advanceTimersByTime(15000); // 3 * 5000
    expect(performSpy).toHaveBeenCalledTimes(3);

    service.handleSaveFailure('x'); // 4th failure
    jest.advanceTimersByTime(20000); // 4 * 5000
    expect(performSpy).toHaveBeenCalledTimes(4);

    // Now exceed maxRetries -> error state, no scheduled call until timer
    service.handleSaveFailure('terminal'); // 5th marks error (>= maxRetries)
    const errorEvent = statusEvents.find((e) => e.status === 'error');
    expect(errorEvent).toBeDefined();
  });
});
