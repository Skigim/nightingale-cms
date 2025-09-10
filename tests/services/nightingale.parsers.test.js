/**
 * @jest-environment jsdom
 */

import NightingaleParsers from '../../src/services/nightingale.parsers.js';

// Mock NightingaleDayJS
jest.mock('../../src/services/nightingale.dayjs.js', () => ({
  formatToday: jest.fn(() => '2024-03-15'),
}));

describe('NightingaleParsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAvsAccountBlock', () => {
    const knownAccountTypes = [
      'Checking Account',
      'Savings Account',
      'Money Market',
    ];

    test('should parse a complete AVS account block correctly', () => {
      const block = `John Doe Checking Account
First National Bank - (12345678)
Some other info
Balance as of 03/14/2024 - $1,234.56`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result).toEqual({
        type: 'Checking',
        owner: 'John Doe',
        location: 'First National Bank',
        accountNumber: '5678',
        value: 1234.56,
        verificationStatus: 'Verified',
        source: 'AVS as of 2024-03-15',
      });
    });

    test('should handle multiple owners separated by semicolons', () => {
      const block = `John Doe; Jane Smith Savings Account
Credit Union - (98765432)
Balance as of 03/14/2024 - $500.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result).toEqual({
        type: 'Savings',
        owner: 'John Doe, Jane Smith',
        location: 'Credit Union',
        accountNumber: '5432',
        value: 500,
        verificationStatus: 'Verified',
        source: 'AVS as of 2024-03-15',
      });
    });

    test('should handle account type not in known types', () => {
      const block = `John Doe Unknown Account Type
Bank Name - (11111111)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result).toEqual({
        type: 'N/A',
        owner: 'John Doe Unknown Account Type',
        location: 'Bank Name',
        accountNumber: '1111',
        value: 100,
        verificationStatus: 'Verified',
        source: 'AVS as of 2024-03-15',
      });
    });

    test('should handle negative balance', () => {
      const block = `John Doe Checking Account
Bank Name - (22222222)
Balance as of 03/14/2024 - -$50.25`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.value).toBe(-50.25);
    });

    test('should handle balance with commas and special characters', () => {
      const block = `John Doe Savings Account
Bank Name - (33333333)
Balance as of 03/14/2024 - $1,234,567.89`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.value).toBe(1234567.89);
    });

    test('should handle missing balance line', () => {
      const block = `John Doe Checking Account
Bank Name - (44444444)
Some other info`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.value).toBe(0);
    });

    test('should handle missing bank info', () => {
      const block = `John Doe Checking Account
No bank info here
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.location).toBe('N/A');
      expect(result.accountNumber).toBe('N/A');
    });

    test('should prefer longer account type matches', () => {
      const block = `John Doe Money Market
Bank Name - (55555555)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.type).toBe('Money Market');
      expect(result.owner).toBe('John Doe');
    });

    test('should handle short account numbers', () => {
      const block = `John Doe Checking Account
Bank Name - (123)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.accountNumber).toBe('123');
    });

    test('should filter out empty owner parts', () => {
      const block = `John Doe; ; Jane Smith Checking Account
Bank Name - (66666666)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.owner).toBe('John Doe, Jane Smith');
    });

    // Edge cases and error handling
    test('should return null for invalid input', () => {
      expect(
        NightingaleParsers.parseAvsAccountBlock(null, knownAccountTypes),
      ).toBeNull();
      expect(
        NightingaleParsers.parseAvsAccountBlock(undefined, knownAccountTypes),
      ).toBeNull();
      expect(
        NightingaleParsers.parseAvsAccountBlock('', knownAccountTypes),
      ).toBeNull();
      expect(
        NightingaleParsers.parseAvsAccountBlock(123, knownAccountTypes),
      ).toBeNull();
    });

    test('should return null for insufficient lines', () => {
      const block = 'Only one line';
      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result).toBeNull();
    });

    test('should handle non-array knownAccountTypes', () => {
      const block = `John Doe Checking Account
Bank Name - (77777777)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(block, null);

      expect(result).not.toBeNull();
      expect(result.type).toBe('N/A');
    });

    test('should handle unparseable balance', () => {
      const block = `John Doe Checking Account
Bank Name - (88888888)
Balance as of 03/14/2024 - Not a number`;

      const result = NightingaleParsers.parseAvsAccountBlock(
        block,
        knownAccountTypes,
      );

      expect(result.value).toBe(0);
    });
  });

  describe('parseAvsData', () => {
    const knownAccountTypes = ['Checking Account', 'Savings Account'];

    test('should parse multiple account blocks', () => {
      const rawInput = `Some header text
Account Owner: John Doe Checking Account
First Bank - (11111111)
Balance as of 03/14/2024 - $1,000.00

Account Owner: Jane Smith Savings Account
Second Bank - (22222222)
Balance as of 03/14/2024 - $2,000.00`;

      const result = NightingaleParsers.parseAvsData(
        rawInput,
        knownAccountTypes,
      );

      expect(result).toHaveLength(2);
      expect(result[0].owner).toBe('John Doe');
      expect(result[0].type).toBe('Checking');
      expect(result[0].value).toBe(1000);
      expect(result[1].owner).toBe('Jane Smith');
      expect(result[1].type).toBe('Savings');
      expect(result[1].value).toBe(2000);
    });

    test('should filter out invalid account blocks', () => {
      const rawInput = `Account Owner: John Doe Checking Account
First Bank - (11111111)
Balance as of 03/14/2024 - $1,000.00

Account Owner: Invalid Block

Account Owner: Jane Smith Savings Account
Second Bank - (22222222)
Balance as of 03/14/2024 - $2,000.00`;

      const result = NightingaleParsers.parseAvsData(
        rawInput,
        knownAccountTypes,
      );

      expect(result).toHaveLength(2);
      expect(result[0].owner).toBe('John Doe');
      expect(result[1].owner).toBe('Jane Smith');
    });

    test('should return empty array for no account blocks', () => {
      const rawInput = 'Some text without account blocks';
      const result = NightingaleParsers.parseAvsData(
        rawInput,
        knownAccountTypes,
      );

      expect(result).toEqual([]);
    });

    test('should handle single account block', () => {
      const rawInput = `Account Owner: John Doe Checking Account
First Bank - (11111111)
Balance as of 03/14/2024 - $1,000.00`;

      const result = NightingaleParsers.parseAvsData(
        rawInput,
        knownAccountTypes,
      );

      expect(result).toHaveLength(1);
      expect(result[0].owner).toBe('John Doe');
    });

    // Edge cases
    test('should return empty array for invalid input', () => {
      expect(NightingaleParsers.parseAvsData(null, knownAccountTypes)).toEqual(
        [],
      );
      expect(
        NightingaleParsers.parseAvsData(undefined, knownAccountTypes),
      ).toEqual([]);
      expect(NightingaleParsers.parseAvsData('', knownAccountTypes)).toEqual(
        [],
      );
      expect(NightingaleParsers.parseAvsData('   ', knownAccountTypes)).toEqual(
        [],
      );
      expect(NightingaleParsers.parseAvsData(123, knownAccountTypes)).toEqual(
        [],
      );
    });

    test('should handle non-array knownAccountTypes', () => {
      const rawInput = `Account Owner: John Doe Unknown Type
Bank Name - (99999999)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsData(rawInput, null);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('N/A');
    });
  });

  describe('integration', () => {
    test('should integrate with NightingaleDayJS for date formatting', () => {
      const block = `John Doe Checking Account
Bank Name - (12345678)
Balance as of 03/14/2024 - $100.00`;

      const result = NightingaleParsers.parseAvsAccountBlock(block, [
        'Checking Account',
      ]);

      expect(result.source).toBe('AVS as of 2024-03-15');
    });
  });
});
