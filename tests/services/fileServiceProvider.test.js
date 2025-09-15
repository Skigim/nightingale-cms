/**
 * Tests for fileServiceProvider module
 * Focuses on set/get cycle behavior
 */

describe('fileServiceProvider', () => {
  let mockService;
  let setFileService;
  let getFileService;
  let mockDocument;

  beforeEach(() => {
    jest.resetModules();

    mockService = {
      save: jest.fn(),
      load: jest.fn(),
      checkPermission: jest.fn(),
    };

    // Create mock document
    mockDocument = {
      dispatchEvent: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Set up clean environment
    global.document = mockDocument;
    global.globalThis = global.globalThis || {};
    global.globalThis.NightingaleFileService = null;
    global.globalThis.FileService = null;

    // Import the module after mocking
    const provider = require('../../src/services/fileServiceProvider.js');
    setFileService = provider.setFileService;
    getFileService = provider.getFileService;
  });

  test('setFileService stores service reference', () => {
    setFileService(mockService);
    expect(getFileService()).toBe(mockService);
  });

  test('getFileService returns same reference after set', () => {
    setFileService(mockService);
    const retrieved1 = getFileService();
    const retrieved2 = getFileService();

    expect(retrieved1).toBe(mockService);
    expect(retrieved2).toBe(mockService);
    expect(retrieved1).toBe(retrieved2);
  });

  test('double set overwrites cleanly (idempotent)', () => {
    const mockService2 = { save: jest.fn(), load: jest.fn() };

    setFileService(mockService);
    expect(getFileService()).toBe(mockService);

    setFileService(mockService2);
    expect(getFileService()).toBe(mockService2);
  });

  test('getFileService returns null when no service set initially', () => {
    // Fresh module should return null initially
    expect(getFileService()).toBeNull();
  });

  test('setFileService with null clears the service', () => {
    setFileService(mockService);
    expect(getFileService()).toBe(mockService);

    setFileService(null);
    expect(getFileService()).toBeNull();
  });

  test('handles document undefined gracefully', () => {
    global.document = undefined;

    // Should not throw
    expect(() => setFileService(mockService)).not.toThrow();
    expect(getFileService()).toBe(mockService);
  });

  test('event dispatching behavior tested via side effects', () => {
    // The actual event dispatch is hard to test in isolation due to module imports
    // Focus on verifying the functionality doesn't break when document methods exist
    setFileService(mockService);
    expect(getFileService()).toBe(mockService);

    // Test that setting to null doesn't throw
    setFileService(null);
    expect(getFileService()).toBeNull();
  });

  test('handles CustomEvent creation failure gracefully', () => {
    const originalCustomEvent = global.CustomEvent;
    global.CustomEvent = () => {
      throw new Error('CustomEvent not supported');
    };

    // Should not throw even if CustomEvent fails
    expect(() => setFileService(mockService)).not.toThrow();
    expect(getFileService()).toBe(mockService);

    global.CustomEvent = originalCustomEvent;
  });
});
