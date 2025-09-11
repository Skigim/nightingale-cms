/**
 * @jest-environment node
 */

/**
 * Tests for Nightingale Search Service
 * Tests the Fuse.js wrapper functionality
 */

import SearchService, {
  createIndex,
  search,
  DEFAULT_OPTIONS,
} from '../../src/services/nightingale.search.js';

describe('NightingaleSearch', () => {
  // Sample test data
  const sampleData = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '555-0123',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
      },
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '555-0456',
      address: {
        street: '456 Oak Ave',
        city: 'Somewhere',
        state: 'NY',
        zip: '67890',
      },
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@test.com',
      phone: '555-0789',
      address: {
        street: '789 Pine Rd',
        city: 'Elsewhere',
        state: 'TX',
        zip: '54321',
      },
    },
  ];

  describe('DEFAULT_OPTIONS', () => {
    test('should have proper default configuration', () => {
      expect(DEFAULT_OPTIONS).toBeDefined();
      expect(DEFAULT_OPTIONS.includeScore).toBe(true);
      expect(DEFAULT_OPTIONS.threshold).toBe(0.3);
      expect(DEFAULT_OPTIONS.ignoreLocation).toBe(true);
      expect(DEFAULT_OPTIONS.minMatchCharLength).toBe(2);
      expect(Array.isArray(DEFAULT_OPTIONS.keys)).toBe(true);
      expect(DEFAULT_OPTIONS.keys).toContain('name');
      expect(DEFAULT_OPTIONS.keys).toContain('email');
      expect(DEFAULT_OPTIONS.keys).toContain('phone');
    });
  });

  describe('createIndex()', () => {
    test('should create Fuse index with default options', () => {
      const index = createIndex(sampleData);
      expect(index).toBeDefined();
      expect(index.search).toBeDefined(); // Fuse instance should have search method
    });

    test('should create Fuse index with custom options', () => {
      const customOptions = { threshold: 0.1, keys: ['name'] };
      const index = createIndex(sampleData, customOptions);
      expect(index).toBeDefined();
    });

    test('should handle empty list', () => {
      const index = createIndex([]);
      expect(index).toBeDefined();
      const results = index.search('anything');
      expect(results).toEqual([]);
    });

    test('should handle no list provided', () => {
      const index = createIndex();
      expect(index).toBeDefined();
    });
  });

  describe('search()', () => {
    test('should search by name', () => {
      const results = search(sampleData, 'John');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toContain('John');
      expect(typeof results[0].score).toBe('number');
    });

    test('should search by email', () => {
      const results = search(sampleData, 'jane.smith');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.email).toContain('jane.smith');
    });

    test('should search by phone number', () => {
      const results = search(sampleData, '555-0456');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.phone).toBe('555-0456');
    });

    test('should search by address fields', () => {
      const results = search(sampleData, 'Main St');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.address.street).toContain('Main St');
    });

    test('should search by city', () => {
      const results = search(sampleData, 'Anytown');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.address.city).toBe('Anytown');
    });

    test('should search by state', () => {
      const results = search(sampleData, 'CA');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.address.state).toBe('CA');
    });

    test('should search by zip code', () => {
      const results = search(sampleData, '12345');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.address.zip).toBe('12345');
    });

    test('should return empty array for empty query', () => {
      expect(search(sampleData, '')).toEqual([]);
      expect(search(sampleData, '   ')).toEqual([]);
      expect(search(sampleData, null)).toEqual([]);
      expect(search(sampleData, undefined)).toEqual([]);
    });

    test('should return empty array for no matches', () => {
      const results = search(sampleData, 'zzzznonexistent');
      expect(results).toEqual([]);
    });

    test('should work with pre-created Fuse index', () => {
      const index = createIndex(sampleData);
      const results = search(index, 'John');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toContain('John');
    });

    test('should accept custom options when using array input', () => {
      const customOptions = {
        threshold: 0.1, // More strict matching
        keys: ['name'], // Only search names
      };
      const results = search(sampleData, 'john', customOptions);
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle invalid input gracefully', () => {
      expect(search(null, 'query')).toEqual([]);
      expect(search(undefined, 'query')).toEqual([]);
      expect(search('not-array-or-fuse', 'query')).toEqual([]);
      expect(search({}, 'query')).toEqual([]);
    });

    test('should preserve item structure in results', () => {
      const results = search(sampleData, 'John');
      expect(results[0]).toHaveProperty('item');
      expect(results[0]).toHaveProperty('score');
      expect(results[0].item).toHaveProperty('id');
      expect(results[0].item).toHaveProperty('name');
      expect(results[0].item).toHaveProperty('email');
      expect(results[0].item).toHaveProperty('phone');
      expect(results[0].item).toHaveProperty('address');
    });
  });

  describe('SearchService default export', () => {
    test('should export complete service object', () => {
      expect(SearchService).toBeDefined();
      expect(typeof SearchService.createIndex).toBe('function');
      expect(typeof SearchService.search).toBe('function');
      expect(SearchService.DEFAULT_OPTIONS).toBeDefined();
    });

    test('should provide same functionality as named exports', () => {
      // Test that default export methods work the same as named exports
      const indexFromDefault = SearchService.createIndex(sampleData);
      const indexFromNamed = createIndex(sampleData);

      const resultsFromDefault = SearchService.search(sampleData, 'John');
      const resultsFromNamed = search(sampleData, 'John');

      expect(resultsFromDefault).toEqual(resultsFromNamed);
    });
  });

  describe('Performance and edge cases', () => {
    test('should handle large datasets efficiently', () => {
      // Create a larger dataset
      const largeData = [];
      for (let i = 0; i < 1000; i++) {
        largeData.push({
          id: i,
          name: `Person ${i}`,
          email: `person${i}@example.com`,
          phone: `555-${i.toString().padStart(4, '0')}`,
        });
      }

      const startTime = Date.now();
      const results = search(largeData, 'Person 123');
      const endTime = Date.now();

      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test('should handle special characters in search', () => {
      const specialData = [
        { name: 'José García', email: 'jose@example.com' },
        { name: 'François Müller', email: 'francois@example.com' },
        { name: "O'Connor", email: 'oconnor@example.com' },
      ];

      const results1 = search(specialData, 'José');
      const results2 = search(specialData, 'François');
      const results3 = search(specialData, "O'Connor");

      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
      expect(results3.length).toBeGreaterThan(0);
    });

    test('should be case insensitive', () => {
      const results1 = search(sampleData, 'JOHN');
      const results2 = search(sampleData, 'john');
      const results3 = search(sampleData, 'John');

      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
      expect(results3.length).toBeGreaterThan(0);
    });

    test('should handle partial matches', () => {
      const results = search(sampleData, 'Jo'); // Partial match for "John"
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
