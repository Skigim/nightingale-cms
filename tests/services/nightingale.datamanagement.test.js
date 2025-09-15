/**
 * @jest-environment node
 */
import NightingaleDataManagement, {
  generateSecureId,
  findPersonById,
  normalizeDataMigrations,
  updateCaseInCollection,
  updatePersonInCollection,
  updateOrganizationInCollection,
  transformFinancialItems,
  validateCaseData,
  validatePersonData,
  validateOrganizationData,
} from '../../src/services/nightingale.datamanagement.js';

// Mock crypto for testing
const mockCrypto = {
  randomUUID: jest.fn(() => 'mocked-uuid-123'),
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = 123456789;
    }
    return array;
  }),
};

describe('NightingaleDataManagement Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Structure', () => {
    test('default export includes all expected functions', () => {
      expect(NightingaleDataManagement).toHaveProperty('generateSecureId');
      expect(NightingaleDataManagement).toHaveProperty('findPersonById');
      expect(NightingaleDataManagement).toHaveProperty(
        'normalizeDataMigrations',
      );
      expect(NightingaleDataManagement).toHaveProperty(
        'updateCaseInCollection',
      );
      expect(NightingaleDataManagement).toHaveProperty(
        'updatePersonInCollection',
      );
      expect(NightingaleDataManagement).toHaveProperty(
        'updateOrganizationInCollection',
      );
      expect(NightingaleDataManagement).toHaveProperty(
        'transformFinancialItems',
      );
      expect(NightingaleDataManagement).toHaveProperty('validateCaseData');
      expect(NightingaleDataManagement).toHaveProperty('validatePersonData');
      expect(NightingaleDataManagement).toHaveProperty(
        'validateOrganizationData',
      );
    });

    test('includes version and name metadata', () => {
      expect(NightingaleDataManagement.version).toBe('1.0.0');
      expect(NightingaleDataManagement.name).toBe('NightingaleDataManagement');
    });

    test('individual functions are exported', () => {
      expect(typeof generateSecureId).toBe('function');
      expect(typeof findPersonById).toBe('function');
      expect(typeof normalizeDataMigrations).toBe('function');
      expect(typeof updateCaseInCollection).toBe('function');
      expect(typeof updatePersonInCollection).toBe('function');
      expect(typeof updateOrganizationInCollection).toBe('function');
      expect(typeof transformFinancialItems).toBe('function');
      expect(typeof validateCaseData).toBe('function');
      expect(typeof validatePersonData).toBe('function');
      expect(typeof validateOrganizationData).toBe('function');
    });
  });

  describe('generateSecureId', () => {
    test('generates ID with crypto.randomUUID when available', () => {
      const originalCrypto = global.crypto;
      global.crypto = mockCrypto;

      const id = generateSecureId('test');
      expect(id).toBe('test-mocked-uuid-123');
      expect(mockCrypto.randomUUID).toHaveBeenCalled();

      global.crypto = originalCrypto;
    });

    test('generates ID with crypto.getRandomValues fallback', () => {
      const originalCrypto = global.crypto;
      global.crypto = { getRandomValues: mockCrypto.getRandomValues };

      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890000);

      const id = generateSecureId('test');
      expect(id).toContain('test-');
      expect(mockCrypto.getRandomValues).toHaveBeenCalled();

      global.crypto = originalCrypto;
      Date.now = originalDateNow;
    });

    test('generates ID with Math.random fallback when crypto unavailable', () => {
      const originalCrypto = global.crypto;
      global.crypto = undefined;

      const originalMathRandom = Math.random;
      Math.random = jest.fn(() => 0.123456789);

      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890000);

      const id = generateSecureId('fallback');
      expect(id).toContain('fallback-');
      expect(Math.random).toHaveBeenCalled();

      global.crypto = originalCrypto;
      Math.random = originalMathRandom;
      Date.now = originalDateNow;
    });

    test('uses default prefix when none provided', () => {
      const originalCrypto = global.crypto;
      global.crypto = mockCrypto;

      const id = generateSecureId();
      expect(id).toContain('item-');

      global.crypto = originalCrypto;
    });
  });

  describe('findPersonById', () => {
    const testPeople = [
      { id: 'person-1', name: 'John Doe', email: 'john@example.com' },
      { id: 'person-2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: 'person-3', name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    test('finds person by valid ID', () => {
      const person = findPersonById(testPeople, 'person-2');
      expect(person).toEqual(testPeople[1]);
    });

    test('returns undefined for non-existent ID', () => {
      const person = findPersonById(testPeople, 'person-999');
      expect(person).toBeUndefined();
    });

    test('handles empty array', () => {
      const person = findPersonById([], 'person-1');
      expect(person).toBeUndefined();
    });

    test('handles null/undefined input', () => {
      expect(findPersonById(null, 'person-1')).toBeNull();
      expect(findPersonById(undefined, 'person-1')).toBeNull();
      expect(findPersonById(testPeople, null)).toBeNull();
      expect(findPersonById(testPeople, undefined)).toBeNull();
    });

    test('matches with surrounding whitespace and zero-width chars', () => {
      const people = [
        { id: '\u200B 001 \u200B', name: 'Zero Width' },
        { id: '  person-9 ', name: 'Padded Person' },
      ];
      expect(findPersonById(people, '1')).toEqual(people[0]);
      expect(findPersonById(people, 'person-9')).toEqual(people[1]);
    });

    test('matches numeric equivalence after stripping leading zeros', () => {
      const people = [{ id: '0007', name: 'James Bond Variant' }];
      expect(findPersonById(people, '7')).toEqual(people[0]);
      expect(findPersonById(people, '07')).toEqual(people[0]);
      expect(findPersonById(people, '0007')).toEqual(people[0]);
    });
  });

  describe('normalizeDataMigrations', () => {
    test('normalizes basic migration data', async () => {
      const rawData = {
        people: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' },
        ],
        cases: [
          { title: 'Case 1', status: 'open' },
          { title: 'Case 2', status: 'closed' },
        ],
      };

      const normalized = await normalizeDataMigrations(rawData);

      expect(normalized.people).toHaveLength(2);
      expect(normalized.cases).toHaveLength(2);

      // Each case should have an ID
      normalized.cases.forEach((caseItem) => {
        expect(caseItem.id).toBeDefined();
        expect(caseItem.id).toContain('case-');
      });
    });

    test('handles empty data', async () => {
      const normalized = await normalizeDataMigrations({});
      expect(normalized).toEqual({});
    });

    test('preserves existing IDs', async () => {
      const rawData = {
        cases: [
          { id: 'existing-1', title: 'Case 1' },
          { title: 'Case 2' }, // No ID
        ],
      };

      const normalized = await normalizeDataMigrations(rawData);

      expect(normalized.cases[0].id).toBe('existing-1');
      expect(normalized.cases[1].id).toContain('case-');
    });

    test('handles null/undefined input', async () => {
      expect(await normalizeDataMigrations(null)).toBeNull();
      expect(await normalizeDataMigrations(undefined)).toBeUndefined();
    });
  });

  describe('Collection Update Functions', () => {
    describe('updateCaseInCollection', () => {
      const testCases = [
        { id: 'case-1', title: 'Case 1', status: 'open' },
        { id: 'case-2', title: 'Case 2', status: 'closed' },
        { id: 'case-3', title: 'Case 3', status: 'pending' },
      ];

      test('updates existing case', () => {
        const updatedCase = {
          id: 'case-2',
          title: 'Updated Case 2',
          status: 'active',
        };
        const result = updateCaseInCollection(testCases, 'case-2', updatedCase);

        expect(result).toHaveLength(3);
        expect(result[1]).toEqual(updatedCase);
        expect(result[0]).toEqual(testCases[0]); // Others unchanged
        expect(result[2]).toEqual(testCases[2]);
      });

      test('returns original array when case not found', () => {
        const updatedCase = { id: 'case-999', title: 'Non-existent Case' };
        const result = updateCaseInCollection(
          testCases,
          'case-999',
          updatedCase,
        );

        expect(result).toEqual(testCases);
      });

      test('handles empty array', () => {
        const updatedCase = { id: 'case-1', title: 'Updated Case' };
        const result = updateCaseInCollection([], 'case-1', updatedCase);

        expect(result).toEqual([]);
      });
    });

    describe('updatePersonInCollection', () => {
      const testPeople = [
        { id: 'person-1', name: 'John Doe', email: 'john@example.com' },
        { id: 'person-2', name: 'Jane Smith', email: 'jane@example.com' },
      ];

      test('updates existing person', () => {
        const updatedPerson = {
          id: 'person-1',
          name: 'John Updated',
          email: 'john.updated@example.com',
        };
        const result = updatePersonInCollection(
          testPeople,
          'person-1',
          updatedPerson,
        );

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(updatedPerson);
        expect(result[1]).toEqual(testPeople[1]);
      });

      test('returns original array when person not found', () => {
        const updatedPerson = { id: 'person-999', name: 'Non-existent Person' };
        const result = updatePersonInCollection(
          testPeople,
          'person-999',
          updatedPerson,
        );

        expect(result).toEqual(testPeople);
      });
    });

    describe('updateOrganizationInCollection', () => {
      const testOrgs = [
        { id: 'org-1', name: 'Company A', type: 'corporate' },
        { id: 'org-2', name: 'Company B', type: 'non-profit' },
      ];

      test('updates existing organization', () => {
        const updatedOrg = {
          id: 'org-1',
          name: 'Updated Company A',
          type: 'government',
        };
        const result = updateOrganizationInCollection(
          testOrgs,
          'org-1',
          updatedOrg,
        );

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(updatedOrg);
        expect(result[1]).toEqual(testOrgs[1]);
      });

      test('returns original array when organization not found', () => {
        const updatedOrg = { id: 'org-999', name: 'Non-existent Org' };
        const result = updateOrganizationInCollection(
          testOrgs,
          'org-999',
          updatedOrg,
        );

        expect(result).toEqual(testOrgs);
      });
    });
  });

  describe('transformFinancialItems', () => {
    test('transforms basic financial items', () => {
      const importedItems = [
        { type: 'equipment', location: 'office', description: 'Computer' },
        { type: 'furniture', location: 'warehouse', cost: 500 },
      ];

      const result = transformFinancialItems(importedItems);

      expect(result).toHaveLength(2);

      result.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.id).toContain('financial-');
        expect(item.description).toBeDefined();
      });

      expect(result[0].description).toBe('Computer');
      expect(result[1].description).toBe('furniture - warehouse');
    });

    test('handles empty array', () => {
      const result = transformFinancialItems([]);
      expect(result).toEqual([]);
    });

    test('generates fallback descriptions', () => {
      const importedItems = [
        { type: 'equipment' }, // No location or description
        { location: 'office' }, // No type or description
        {}, // No data at all
      ];

      const result = transformFinancialItems(importedItems);

      expect(result).toHaveLength(3);
      expect(result[0].description).toBe('equipment');
      expect(result[1].description).toBe('Unknown Item');
      expect(result[2].description).toBe('Unknown Item');
    });
  });

  describe('Validation Functions', () => {
    describe('validateCaseData', () => {
      test('validates correct case data', () => {
        const validCase = {
          mcn: 'MCN-123',
          personId: 'person-123',
        };

        const errors = validateCaseData(validCase);
        expect(Object.keys(errors)).toHaveLength(0);
      });

      test('detects missing mcn', () => {
        const invalidCase = {
          personId: 'person-123',
        };

        const errors = validateCaseData(invalidCase);
        expect(errors.mcn).toBe('MCN is required');
      });

      test('detects missing personId', () => {
        const invalidCase = {
          mcn: 'MCN-123',
        };

        const errors = validateCaseData(invalidCase);
        expect(errors.personId).toBe('Person selection is required');
      });

      test('handles null/undefined input', () => {
        const errorsNull = validateCaseData(null);
        expect(errorsNull.mcn).toBe('MCN is required');
        expect(errorsNull.personId).toBe('Person selection is required');

        const errorsUndef = validateCaseData(undefined);
        expect(errorsUndef.mcn).toBe('MCN is required');
        expect(errorsUndef.personId).toBe('Person selection is required');
      });
    });

    describe('validatePersonData', () => {
      test('validates correct person data', () => {
        const validPerson = {
          name: 'John Doe',
        };

        const errors = validatePersonData(validPerson);
        expect(Object.keys(errors)).toHaveLength(0);
      });

      test('detects missing name', () => {
        const invalidPerson = {
          email: 'john.doe@example.com',
        };

        const errors = validatePersonData(invalidPerson);
        expect(errors.name).toBe('Name is required');
      });

      test('detects empty name', () => {
        const invalidPerson = {
          name: '   ',
        };

        const errors = validatePersonData(invalidPerson);
        expect(errors.name).toBe('Name is required');
      });

      test('handles null/undefined input', () => {
        const errorsNull = validatePersonData(null);
        expect(errorsNull.name).toBe('Name is required');

        const errorsUndef = validatePersonData(undefined);
        expect(errorsUndef.name).toBe('Name is required');
      });
    });

    describe('validateOrganizationData', () => {
      test('validates correct organization data', () => {
        const validOrg = {
          name: 'Valid Organization',
          type: 'corporate',
        };

        const errors = validateOrganizationData(validOrg);
        expect(Object.keys(errors)).toHaveLength(0);
      });

      test('detects missing name', () => {
        const invalidOrg = {
          type: 'corporate',
        };

        const errors = validateOrganizationData(invalidOrg);
        expect(errors.name).toBe('Organization name is required');
      });

      test('detects empty name', () => {
        const invalidOrg = {
          name: '   ',
          type: 'corporate',
        };

        const errors = validateOrganizationData(invalidOrg);
        expect(errors.name).toBe('Organization name is required');
      });

      test('handles null/undefined input', () => {
        const errorsNull = validateOrganizationData(null);
        expect(errorsNull.name).toBe('Organization name is required');

        const errorsUndef = validateOrganizationData(undefined);
        expect(errorsUndef.name).toBe('Organization name is required');
      });
    });
  });

  describe('Backward Compatibility', () => {
    test('maintains default export structure', () => {
      expect(NightingaleDataManagement).toBeDefined();
      expect(typeof NightingaleDataManagement).toBe('object');
      expect(NightingaleDataManagement.name).toBe('NightingaleDataManagement');
      expect(NightingaleDataManagement.version).toBe('1.0.0');
    });
  });
});
