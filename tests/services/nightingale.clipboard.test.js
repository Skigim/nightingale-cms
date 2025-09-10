/**
 * Minimal test for Nightingale Clipboard Service
 * Tests core functionality without browser dependencies
 */

import NightingaleClipboard from '../../src/services/nightingale.clipboard.js';

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
  });
});
