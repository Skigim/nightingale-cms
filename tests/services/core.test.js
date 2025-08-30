/**
 * Core Utilities Service Tests
 *
 * Tests for security, validation, formatting, and data utilities
 */

import NightingaleCoreUtilities from '../../src/services/core';

describe('NightingaleCoreUtilities', () => {
  describe('Security Functions', () => {
    test('sanitize escapes HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = NightingaleCoreUtilities.sanitize(input);
      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    test('sanitize handles empty and null values', () => {
      expect(NightingaleCoreUtilities.sanitize('')).toBe('');
      expect(NightingaleCoreUtilities.sanitize(null)).toBe('');
      expect(NightingaleCoreUtilities.sanitize(undefined)).toBe('');
    });

    test('encodeURL properly encodes values', () => {
      expect(NightingaleCoreUtilities.encodeURL('hello world')).toBe(
        'hello%20world'
      );
      expect(NightingaleCoreUtilities.encodeURL('test@example.com')).toBe(
        'test%40example.com'
      );
      expect(NightingaleCoreUtilities.encodeURL(123)).toBe('123');
    });

    test('encodeURL handles invalid values', () => {
      expect(NightingaleCoreUtilities.encodeURL(null)).toBe('');
      expect(NightingaleCoreUtilities.encodeURL(undefined)).toBe('');
      expect(NightingaleCoreUtilities.encodeURL({})).toBe('');
    });
  });

  describe('Date Formatting', () => {
    test('formatDate converts ISO date to MM/DD/YYYY', () => {
      const result = NightingaleCoreUtilities.formatDate(
        '2025-08-30T10:30:00.000Z'
      );
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    test('formatDate handles invalid dates', () => {
      expect(NightingaleCoreUtilities.formatDate('')).toBe('N/A');
      expect(NightingaleCoreUtilities.formatDate('invalid')).toBe('N/A');
      expect(NightingaleCoreUtilities.formatDate(null)).toBe('N/A');
    });

    test('toInputDateFormat converts to YYYY-MM-DD', () => {
      const result = NightingaleCoreUtilities.toInputDateFormat(
        '2025-08-30T10:30:00.000Z'
      );
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('toInputDateFormat handles invalid dates', () => {
      expect(NightingaleCoreUtilities.toInputDateFormat('')).toBe('');
      expect(NightingaleCoreUtilities.toInputDateFormat('invalid')).toBe('');
      expect(NightingaleCoreUtilities.toInputDateFormat(null)).toBe('');
    });
  });

  describe('Text Formatting', () => {
    test('formatPhoneNumber formats 10-digit numbers', () => {
      expect(NightingaleCoreUtilities.formatPhoneNumber('1234567890')).toBe(
        '(123) 456-7890'
      );
      expect(NightingaleCoreUtilities.formatPhoneNumber('123-456-7890')).toBe(
        '(123) 456-7890'
      );
      expect(NightingaleCoreUtilities.formatPhoneNumber('(123) 456-7890')).toBe(
        '(123) 456-7890'
      );
    });

    test('formatPhoneNumber handles partial numbers', () => {
      expect(NightingaleCoreUtilities.formatPhoneNumber('123')).toBe('123');
      expect(NightingaleCoreUtilities.formatPhoneNumber('1234')).toBe(
        '(123) 4'
      );
      expect(NightingaleCoreUtilities.formatPhoneNumber('1234567')).toBe(
        '(123) 456-7'
      );
    });

    test('formatPhoneNumber handles empty values', () => {
      expect(NightingaleCoreUtilities.formatPhoneNumber('')).toBe('');
      expect(NightingaleCoreUtilities.formatPhoneNumber(null)).toBe('');
    });

    test('formatProperCase converts names to proper case', () => {
      expect(NightingaleCoreUtilities.formatProperCase('JOHN DOE')).toBe(
        'John Doe'
      );
      expect(NightingaleCoreUtilities.formatProperCase('doe, john')).toBe(
        'John Doe'
      );
      expect(
        NightingaleCoreUtilities.formatProperCase('SMITH, JANE MARIE')
      ).toBe('Jane Marie Smith');
    });

    test('formatProperCase handles edge cases', () => {
      expect(NightingaleCoreUtilities.formatProperCase('')).toBe('');
      expect(NightingaleCoreUtilities.formatProperCase(null)).toBe('');
      expect(NightingaleCoreUtilities.formatProperCase('   ')).toBe('');
    });

    test('formatPersonName converts to Last, First format', () => {
      expect(NightingaleCoreUtilities.formatPersonName('John Doe')).toBe(
        'Doe, John'
      );
      expect(
        NightingaleCoreUtilities.formatPersonName('Jane Marie Smith')
      ).toBe('Smith, Jane Marie');
      expect(NightingaleCoreUtilities.formatPersonName('Doe, John')).toBe(
        'Doe, John'
      ); // Already formatted
    });
  });

  describe('Validation Functions', () => {
    test('required validator works correctly', () => {
      const validator = NightingaleCoreUtilities.Validators.required();

      expect(validator('test').isValid).toBe(true);
      expect(validator('').isValid).toBe(false);
      expect(validator('  ').isValid).toBe(false);
      expect(validator(null).isValid).toBe(false);
    });

    test('email validator works correctly', () => {
      const validator = NightingaleCoreUtilities.Validators.email();

      expect(validator('test@example.com').isValid).toBe(true);
      expect(validator('user.name@domain.co.uk').isValid).toBe(true);
      expect(validator('invalid-email').isValid).toBe(false);
      expect(validator('').isValid).toBe(true); // Empty is valid (not required)
    });

    test('phone validator works correctly', () => {
      const validator = NightingaleCoreUtilities.Validators.phone();

      expect(validator('1234567890').isValid).toBe(true);
      expect(validator('(123) 456-7890').isValid).toBe(true);
      expect(validator('123-456-7890').isValid).toBe(true);
      expect(validator('123').isValid).toBe(false);
      expect(validator('').isValid).toBe(true); // Empty is valid (not required)
    });

    test('mcn validator works correctly', () => {
      const validator = NightingaleCoreUtilities.Validators.mcn();

      expect(validator('ABC123').isValid).toBe(true);
      expect(validator('TEST-CASE_123').isValid).toBe(true);
      expect(validator('AB').isValid).toBe(false); // Too short
      expect(validator('').isValid).toBe(true); // Empty is valid (not required)
    });

    test('minLength validator works correctly', () => {
      const validator = NightingaleCoreUtilities.Validators.minLength(5);

      expect(validator('12345').isValid).toBe(true);
      expect(validator('123456').isValid).toBe(true);
      expect(validator('1234').isValid).toBe(false);
      expect(validator('').isValid).toBe(true); // Empty is valid (not required)
    });

    test('maxLength validator works correctly', () => {
      const validator = NightingaleCoreUtilities.Validators.maxLength(5);

      expect(validator('12345').isValid).toBe(true);
      expect(validator('1234').isValid).toBe(true);
      expect(validator('123456').isValid).toBe(false);
      expect(validator('').isValid).toBe(true); // Empty is valid (not required)
    });
  });

  describe('Data Utilities', () => {
    test('getNextId returns correct next ID', () => {
      const items = [{ id: 1 }, { id: 3 }, { id: 5 }];

      expect(NightingaleCoreUtilities.getNextId(items)).toBe(6);
    });

    test('getNextId handles empty array', () => {
      expect(NightingaleCoreUtilities.getNextId([])).toBe(1);
      expect(NightingaleCoreUtilities.getNextId(null)).toBe(1);
    });

    test('getNextId handles items without ID', () => {
      const items = [{ name: 'test' }, { id: 2 }];

      expect(NightingaleCoreUtilities.getNextId(items)).toBe(3);
    });
  });

  describe('Search Service', () => {
    test('creates search service instance', () => {
      const data = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ];

      const searchService = new NightingaleCoreUtilities.SearchService(data, {
        keys: ['name'],
      });

      expect(searchService).toBeDefined();
      expect(searchService.data).toEqual(data);
    });

    test('handles search service without Fuse.js', () => {
      // Temporarily remove Fuse from global
      const originalFuse = global.Fuse;
      delete global.Fuse;

      const data = [{ id: 1, name: 'Test' }];
      const searchService = new NightingaleCoreUtilities.SearchService(data);

      expect(searchService.isReady()).toBe(false);
      expect(searchService.search('test')).toEqual([]);

      // Restore Fuse
      global.Fuse = originalFuse;
    });
  });
});
