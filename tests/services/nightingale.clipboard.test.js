/**
 * Minimal test for Nightingale Clipboard Service
 * Tests core functionality without browser dependencies
 */

import NightingaleClipboard from '../../src/services/nightingale.clipboard.js';

beforeEach(() => {
  // Reset globals to a neutral state each test
  try {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });
  } catch (_) {
    window.isSecureContext = false; // fallback
  }
  // Ensure navigator exists (JSDOM) but do not replace (can be read-only)
  if (!('clipboard' in navigator)) {
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: {},
        configurable: true,
        writable: true,
      });
    } catch (_) {
      // ignore
    }
  }
  if (!document.execCommand) {
    document.execCommand = jest.fn(() => true);
  } else {
    document.execCommand = jest.fn(document.execCommand);
  }
});

describe('NightingaleClipboard Core', () => {
  describe('Account number masking', () => {
    test('should mask account number correctly', () => {
      const masked = NightingaleClipboard._maskAccountNumber('1234567890');
      expect(masked).toBe('******7890');
    });

    test('should handle short account numbers', () => {
      const masked = NightingaleClipboard._maskAccountNumber('1234');
      expect(masked).toBe('1234');
    });

    test('should handle empty account numbers', () => {
      const masked = NightingaleClipboard._maskAccountNumber('');
      expect(masked).toBe('');
    });

    test('should handle account numbers with non-digits', () => {
      const masked = NightingaleClipboard._maskAccountNumber('123-456-7890');
      expect(masked).toBe('******7890');
    });
  });

  describe('Financial item formatting', () => {
    const sampleItem = {
      description: 'Bank Account',
      amount: 1000,
      type: 'checking',
    };

    test('should format financial item summary', () => {
      const formatted =
        NightingaleClipboard._formatFinancialItemSummary(sampleItem);
      expect(formatted).toBe('Bank Account: $1,000.00');
    });

    test('should handle minimal financial item', () => {
      const minimalItem = { amount: 500 };
      const formatted =
        NightingaleClipboard._formatFinancialItemSummary(minimalItem);
      expect(formatted).toBe('Financial Item: $500.00');
    });
  });

  describe('Static methods', () => {
    test('should create debounced copy function', () => {
      const debouncedCopy = NightingaleClipboard.createDebouncedCopy(100);
      expect(typeof debouncedCopy).toBe('function');
    });

    test('copyText returns false for empty string', async () => {
      const result = await NightingaleClipboard.copyText('');
      expect(result).toBe(false);
    });

    test('copyText uses modern API when available', async () => {
      const writeText = jest.fn(() => Promise.resolve());
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        });
      } catch (_) {
        navigator.clipboard = { writeText }; // fallback mutate
      }
      try {
        Object.defineProperty(window, 'isSecureContext', {
          value: true,
          configurable: true,
        });
      } catch (_) {
        window.isSecureContext = true;
      }
      const result = await NightingaleClipboard.copyText('Hello');
      expect(writeText).toHaveBeenCalledWith('Hello');
      expect(result).toBe(true);
      expect(document.execCommand).not.toHaveBeenCalled();
    });

    test('copyText falls back when modern API throws', async () => {
      const writeText = jest.fn(() => Promise.reject(new Error('fail')));
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText },
          configurable: true,
        });
      } catch (_) {
        navigator.clipboard = { writeText };
      }
      try {
        Object.defineProperty(window, 'isSecureContext', {
          value: true,
          configurable: true,
        });
      } catch (_) {
        window.isSecureContext = true;
      }
      // mock document.execCommand fallback
      document.execCommand = jest.fn(() => true);
      const result = await NightingaleClipboard.copyText('Hello');
      expect(writeText).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(result).toBe(true);
    });
  });
});
