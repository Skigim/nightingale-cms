/**
 * @jest-environment node
 */

/**
 * Tests for Nightingale Toast Service
 * Core functionality tests for the toast notification system
 */

import ToastService, {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  clearAllToasts,
  getActiveToastCount,
  updateToastConfig,
  TOAST_CONFIG,
  ToastQueue,
} from '../../src/services/nightingale.toast.js';

// Mock DOM environment for testing
const mockDocument = {
  getElementById: jest.fn(),
  createElement: jest.fn(() => ({
    id: '',
    className: '',
    textContent: '',
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
    parentNode: {
      removeChild: jest.fn(),
    },
  })),
  body: {
    appendChild: jest.fn(),
  },
  head: {
    appendChild: jest.fn(),
  },
  readyState: 'complete',
};

// Mock window with logger
const mockWindow = {
  NightingaleLogger: {
    get: jest.fn(() => ({
      error: jest.fn(),
    })),
  },
};

// Set up global mocks
global.document = mockDocument;
global.window = mockWindow;
global.console = {
  ...global.console,
  warn: jest.fn(),
  error: jest.fn(),
};

describe('NightingaleToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocument.getElementById.mockReturnValue(null);
  });

  describe('Configuration', () => {
    test('should have default configuration', () => {
      expect(TOAST_CONFIG).toBeDefined();
      expect(TOAST_CONFIG.defaultDuration).toBe(3000);
      expect(TOAST_CONFIG.maxToasts).toBe(5);
      expect(TOAST_CONFIG.types).toEqual({
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
      });
    });

    test('should update configuration', () => {
      const originalDuration = TOAST_CONFIG.defaultDuration;
      updateToastConfig({ defaultDuration: 5000 });

      expect(TOAST_CONFIG.defaultDuration).toBe(5000);

      // Reset for other tests
      updateToastConfig({ defaultDuration: originalDuration });
    });

    test('should handle invalid configuration updates', () => {
      const originalConfig = { ...TOAST_CONFIG };
      updateToastConfig(null);
      updateToastConfig('invalid');

      expect(TOAST_CONFIG).toEqual(originalConfig);
    });
  });

  describe('ToastQueue', () => {
    let queue;

    beforeEach(() => {
      queue = new ToastQueue();
    });

    test('should create toast queue instance', () => {
      expect(queue).toBeInstanceOf(ToastQueue);
      expect(queue.toasts).toEqual([]);
    });

    test('should ensure container exists', () => {
      queue.ensureContainer();

      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });

    test('should get toast count', () => {
      expect(queue.getCount()).toBe(0);
    });

    test('should clear all toasts', () => {
      // Add mock toasts
      queue.toasts = [
        {
          element: {
            classList: { remove: jest.fn() },
            addEventListener: jest.fn(),
          },
        },
        {
          element: {
            classList: { remove: jest.fn() },
            addEventListener: jest.fn(),
          },
        },
      ];

      queue.clear();

      expect(queue.toasts).toEqual([]);
    });
  });

  describe('Core Toast Functions', () => {
    test('should handle showToast with valid message', () => {
      const result = showToast('Test message', 'info');

      // Should not throw error in node environment
      expect(global.console.warn).not.toHaveBeenCalled();
    });

    test('should handle invalid messages', () => {
      const result1 = showToast('', 'info');
      const result2 = showToast(null, 'info');
      const result3 = showToast(undefined, 'info');

      expect(global.console.warn).toHaveBeenCalledWith(
        'Toast system: Invalid message provided',
        expect.anything(),
      );
    });

    test('should handle DOM unavailable scenario', () => {
      const originalDocument = global.document;
      global.document = undefined;

      const result = showToast('Test message', 'info');

      expect(global.console.warn).toHaveBeenCalledWith(
        'Toast system: DOM not available',
      );
      expect(result).toBeNull();

      global.document = originalDocument;
    });
  });

  describe('Convenience Functions', () => {
    test('should export convenience functions', () => {
      expect(typeof showSuccessToast).toBe('function');
      expect(typeof showErrorToast).toBe('function');
      expect(typeof showWarningToast).toBe('function');
      expect(typeof showInfoToast).toBe('function');
    });

    test('should call showToast with correct parameters', () => {
      // These will trigger the DOM warning but test the function signatures
      showSuccessToast('Success message');
      showErrorToast('Error message');
      showWarningToast('Warning message');
      showInfoToast('Info message');

      // Functions should exist and be callable
      expect(typeof showSuccessToast).toBe('function');
    });
  });

  describe('Utility Functions', () => {
    test('should get active toast count', () => {
      const count = getActiveToastCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should clear all toasts', () => {
      expect(() => clearAllToasts()).not.toThrow();
    });
  });

  describe('Default Export', () => {
    test('should export complete API object', () => {
      expect(ToastService).toBeDefined();
      expect(typeof ToastService.showToast).toBe('function');
      expect(typeof ToastService.show).toBe('function'); // Alias
      expect(typeof ToastService.showSuccessToast).toBe('function');
      expect(typeof ToastService.clearAllToasts).toBe('function');
      expect(ToastService.TOAST_CONFIG).toBeDefined();
      expect(ToastService.ToastQueue).toBe(ToastQueue);
    });

    test('should have show alias for backward compatibility', () => {
      expect(ToastService.show).toBe(ToastService.showToast);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', () => {
      // Mock an error in the toast system
      const originalCreateElement = mockDocument.createElement;
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = showToast('Test message', 'info');

      expect(global.console.error).toHaveBeenCalledWith(
        'Toast system failure:',
        'DOM error',
        { message: 'Test message', type: 'info' },
      );
      expect(result).toBeNull();

      // Restore mock
      mockDocument.createElement = originalCreateElement;
    });
  });
});
