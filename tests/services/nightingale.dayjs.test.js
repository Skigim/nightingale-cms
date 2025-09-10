/**
 * @jest-environment node
 */

/**
 * Tests for Nightingale DayJS Service
 * Tests the date utility wrapper functions
 */

import dateUtils, { dayjs } from '../../src/services/nightingale.dayjs.js';

describe('NightingaleDayJS', () => {
  describe('Core dayjs export', () => {
    test('should export dayjs instance', () => {
      expect(dayjs).toBeDefined();
      expect(typeof dayjs).toBe('function');
    });

    test('should have plugins loaded', () => {
      // Test that custom parse format plugin is working
      const date = dayjs('25/12/2023', 'DD/MM/YYYY');
      expect(date.isValid()).toBe(true);
      expect(date.format('YYYY-MM-DD')).toBe('2023-12-25');
    });

    test('should have relative time plugin working', () => {
      const now = dayjs();
      const past = now.subtract(1, 'hour');
      const relative = past.fromNow();
      expect(relative).toContain('ago');
    });
  });

  describe('dateUtils wrapper', () => {
    describe('now()', () => {
      test('should return current date as ISO string', () => {
        const now = dateUtils.now();
        expect(typeof now).toBe('string');
        expect(new Date(now).toISOString()).toBe(now);
      });
    });

    describe('format()', () => {
      test('should format valid date with default format', () => {
        const result = dateUtils.format('2023-12-25');
        expect(result).toBe('12/25/2023');
      });

      test('should format valid date with custom format', () => {
        const result = dateUtils.format('2023-12-25', 'YYYY-MM-DD');
        expect(result).toBe('2023-12-25');
      });

      test('should return N/A for invalid date', () => {
        expect(dateUtils.format('invalid-date')).toBe('N/A');
        expect(dateUtils.format('')).toBe('N/A');
        expect(dateUtils.format(null)).toBe('N/A');
      });
    });

    describe('compareDates()', () => {
      test('should return -1 when first date is before second', () => {
        const result = dateUtils.compareDates('2023-01-01', '2023-12-31');
        expect(result).toBe(-1);
      });

      test('should return 1 when first date is after second', () => {
        const result = dateUtils.compareDates('2023-12-31', '2023-01-01');
        expect(result).toBe(1);
      });

      test('should return 0 when dates are equal', () => {
        const result = dateUtils.compareDates('2023-01-01', '2023-01-01');
        expect(result).toBe(0);
      });

      test('should return 0 for invalid dates', () => {
        expect(dateUtils.compareDates('invalid', '2023-01-01')).toBe(0);
        expect(dateUtils.compareDates('2023-01-01', 'invalid')).toBe(0);
        expect(dateUtils.compareDates('invalid', 'invalid')).toBe(0);
      });
    });

    describe('isBefore()', () => {
      test('should return true when first date is before second', () => {
        const result = dateUtils.isBefore('2023-01-01', '2023-12-31');
        expect(result).toBe(true);
      });

      test('should return false when first date is after second', () => {
        const result = dateUtils.isBefore('2023-12-31', '2023-01-01');
        expect(result).toBe(false);
      });

      test('should return false for invalid dates', () => {
        expect(dateUtils.isBefore('invalid', '2023-01-01')).toBe(false);
        expect(dateUtils.isBefore('2023-01-01', 'invalid')).toBe(false);
      });
    });

    describe('monthsAgo()', () => {
      test('should return date from months ago', () => {
        const result = dateUtils.monthsAgo(3);
        const expected = dayjs().subtract(3, 'month');
        const resultDate = dayjs(result);

        expect(resultDate.isValid()).toBe(true);
        expect(Math.abs(resultDate.diff(expected, 'minutes'))).toBeLessThan(1); // Allow small time difference
      });
    });

    describe('addDays()', () => {
      test('should return date with added days', () => {
        const result = dateUtils.addDays(7);
        const expected = dayjs().add(7, 'day');
        const resultDate = dayjs(result);

        expect(resultDate.isValid()).toBe(true);
        expect(Math.abs(resultDate.diff(expected, 'minutes'))).toBeLessThan(1);
      });
    });

    describe('addDaysToDate()', () => {
      test('should add days to valid date', () => {
        const result = dateUtils.addDaysToDate('2023-01-01', 7);
        expect(result).toBe('2023-01-08T00:00:00.000Z');
      });

      test('should return original string for invalid date', () => {
        const invalidDate = 'invalid-date';
        const result = dateUtils.addDaysToDate(invalidDate, 7);
        expect(result).toBe(invalidDate);
      });
    });

    describe('formatToday()', () => {
      test('should format today with default format', () => {
        const result = dateUtils.formatToday();
        const expected = dayjs().format('MM/DD/YYYY');
        expect(result).toBe(expected);
      });

      test('should format today with custom format', () => {
        const result = dateUtils.formatToday('YYYY-MM-DD');
        const expected = dayjs().format('YYYY-MM-DD');
        expect(result).toBe(expected);
      });
    });

    describe('todayForInput()', () => {
      test('should return today in input format', () => {
        const result = dateUtils.todayForInput();
        const expected = dayjs().format('YYYY-MM-DD');
        expect(result).toBe(expected);

        // Verify it's a valid date input format
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('Default export', () => {
    test('should export complete dateUtils object', () => {
      expect(dateUtils).toBeDefined();
      expect(typeof dateUtils.now).toBe('function');
      expect(typeof dateUtils.format).toBe('function');
      expect(typeof dateUtils.compareDates).toBe('function');
      expect(typeof dateUtils.isBefore).toBe('function');
      expect(typeof dateUtils.monthsAgo).toBe('function');
      expect(typeof dateUtils.addDays).toBe('function');
      expect(typeof dateUtils.addDaysToDate).toBe('function');
      expect(typeof dateUtils.formatToday).toBe('function');
      expect(typeof dateUtils.todayForInput).toBe('function');
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle various date formats', () => {
      expect(dateUtils.format('2023-12-25T10:30:00Z')).toBe('12/25/2023');
      expect(dateUtils.format('2023/12/25')).toBe('12/25/2023');
      expect(dateUtils.format('Dec 25, 2023')).toBe('12/25/2023');
    });

    test('should handle edge dates', () => {
      expect(dateUtils.format('1900-01-01')).toBe('01/01/1900');
      expect(dateUtils.format('2099-12-31')).toBe('12/31/2099');
    });

    test('should handle zero and negative day additions', () => {
      const today = dayjs().format('YYYY-MM-DD');
      const todayISO = dayjs(today).toISOString();

      expect(dateUtils.addDaysToDate(todayISO, 0)).toBe(todayISO);

      const yesterday = dateUtils.addDaysToDate(todayISO, -1);
      expect(dayjs(yesterday).isBefore(dayjs(todayISO))).toBe(true);
    });
  });
});
