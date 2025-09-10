/**
 * @jest-environment jsdom
 */

import NightingaleCMSUtilities from '../../src/services/cms.js';

describe('NightingaleCMSUtilities', () => {
  const mockCase = {
    id: 1,
    caseNumber: 'CASE-001',
    personId: 1,
    organizationId: 1,
    status: 'Active',
    type: 'Application',
    createdDate: '2024-01-01',
    modifiedDate: '2024-01-15',
    appDetails: {
      appDate: '2024-01-01',
      applicationType: 'Application',
      povertyGuidelines: '185%',
      householdSize: '4',
      totalIncome: '45000',
    },
    financials: {
      resources: [
        { type: 'Checking', value: 1000, owner: 'John Doe' },
        { type: 'Savings', value: 5000, owner: 'John Doe' },
      ],
      income: [{ type: 'Salary', value: 3000, owner: 'John Doe' }],
      expenses: [
        { type: 'Rent', value: 1200, owner: 'John Doe' },
        { type: 'Food', value: 400, owner: 'John Doe' },
      ],
    },
    notes: [
      { category: 'General', content: 'First note' },
      { category: 'Financial', content: 'Second note' },
      { category: 'General', content: 'Third note' },
    ],
  };

  const mockFullData = {
    people: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
      },
    ],
    organizations: [
      {
        id: 1,
        name: 'Test Organization',
        email: 'org@example.com',
        phone: '555-5678',
      },
    ],
  };

  describe('getFlatFinancials', () => {
    test('should flatten all financial items', () => {
      const result = NightingaleCMSUtilities.getFlatFinancials(mockCase);
      expect(result).toHaveLength(5);
      expect(result[0].type).toBe('Checking');
      expect(result[2].type).toBe('Salary');
      expect(result[3].type).toBe('Rent');
    });

    test('should return empty array for no financials', () => {
      const caseWithoutFinancials = { id: 1 };
      const result = NightingaleCMSUtilities.getFlatFinancials(
        caseWithoutFinancials,
      );
      expect(result).toEqual([]);
    });

    test('should handle null case', () => {
      const result = NightingaleCMSUtilities.getFlatFinancials(null);
      expect(result).toEqual([]);
    });

    test('should handle missing financial sections', () => {
      const caseWithPartialFinancials = {
        financials: {
          resources: [{ type: 'Checking', value: 1000 }],
          // income and expenses missing
        },
      };
      const result = NightingaleCMSUtilities.getFlatFinancials(
        caseWithPartialFinancials,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getAppDateLabel', () => {
    test('should return "Application Date" for Application type', () => {
      const result = NightingaleCMSUtilities.getAppDateLabel('Application');
      expect(result).toBe('Application Date');
    });

    test('should return "Renewal Due" for Renewal type', () => {
      const result = NightingaleCMSUtilities.getAppDateLabel('Renewal');
      expect(result).toBe('Renewal Due');
    });

    test('should return "Application Date" for other types', () => {
      const result = NightingaleCMSUtilities.getAppDateLabel('Other');
      expect(result).toBe('Application Date');
    });
  });

  describe('getDefaultAppDetails', () => {
    test('should return default application details', () => {
      const result = NightingaleCMSUtilities.getDefaultAppDetails();

      expect(result).toEqual({
        appDate: '',
        applicationType: 'Application',
        povertyGuidelines: '',
        householdSize: '',
        totalIncome: '',
        annualIncome: '',
        monthlyIncome: '',
        weeklyIncome: '',
        eligibilityStatus: 'Pending',
        notes: '',
      });
    });

    test('should return new object each time', () => {
      const result1 = NightingaleCMSUtilities.getDefaultAppDetails();
      const result2 = NightingaleCMSUtilities.getDefaultAppDetails();

      expect(result1).not.toBe(result2);
      expect(result1).toEqual(result2);
    });
  });

  describe('getUniqueNoteCategories', () => {
    test('should return unique note categories', () => {
      const result = NightingaleCMSUtilities.getUniqueNoteCategories(mockCase);
      expect(result).toEqual(['Financial', 'General']);
    });

    test('should return empty array for no notes', () => {
      const caseWithoutNotes = { id: 1 };
      const result =
        NightingaleCMSUtilities.getUniqueNoteCategories(caseWithoutNotes);
      expect(result).toEqual([]);
    });

    test('should handle null case', () => {
      const result = NightingaleCMSUtilities.getUniqueNoteCategories(null);
      expect(result).toEqual([]);
    });

    test('should filter out empty categories', () => {
      const caseWithEmptyCategories = {
        notes: [
          { category: 'Valid', content: 'Note 1' },
          { category: '', content: 'Note 2' },
          { category: '   ', content: 'Note 3' },
          { category: 'Another Valid', content: 'Note 4' },
        ],
      };
      const result = NightingaleCMSUtilities.getUniqueNoteCategories(
        caseWithEmptyCategories,
      );
      expect(result).toEqual(['Another Valid', 'Valid']);
    });
  });

  describe('generateCaseSummary', () => {
    test('should generate comprehensive case summary', () => {
      const result = NightingaleCMSUtilities.generateCaseSummary(
        mockCase,
        mockFullData,
      );

      expect(result.caseId).toBe(1);
      expect(result.caseNumber).toBe('CASE-001');
      expect(result.status).toBe('Active');
      expect(result.person.name).toBe('John Doe');
      expect(result.organization.name).toBe('Test Organization');
      expect(result.financials.totalItems).toBe(5);
      expect(result.financials.totalResources).toBe(6000);
      expect(result.financials.totalIncome).toBe(3000);
      expect(result.financials.totalExpenses).toBe(1600);
      expect(result.notes.totalNotes).toBe(3);
      expect(result.notes.categories).toEqual(['Financial', 'General']);
    });

    test('should handle missing person and organization', () => {
      const result = NightingaleCMSUtilities.generateCaseSummary(mockCase, {});

      expect(result.person).toBeNull();
      expect(result.organization).toBeNull();
      expect(result.caseId).toBe(1);
    });

    test('should return error for null case', () => {
      const result = NightingaleCMSUtilities.generateCaseSummary(null);
      expect(result.error).toBe('No case object provided');
    });

    test('should calculate completeness correctly', () => {
      const result = NightingaleCMSUtilities.generateCaseSummary(
        mockCase,
        mockFullData,
      );
      expect(result.summary.completeness).toBeGreaterThan(0);
      expect(result.summary.hasFinancials).toBe(true);
      expect(result.summary.hasNotes).toBe(true);
      expect(result.summary.hasAppDetails).toBe(true);
    });
  });

  describe('openVRApp', () => {
    beforeEach(() => {
      // Mock window.open
      global.window.open = jest.fn(() => ({ mockWindow: true }));
    });

    test('should open VR app with default URL', () => {
      const result = NightingaleCMSUtilities.openVRApp();

      expect(window.open).toHaveBeenCalledWith(
        './nightingale-correspondence.html',
        'NightingaleVR',
        'width=1200,height=800,scrollbars=yes,resizable=yes',
      );
      expect(result).toEqual({ mockWindow: true });
    });

    test('should open VR app with custom URL and params', () => {
      const params = { caseId: 123, mode: 'edit' };
      const result = NightingaleCMSUtilities.openVRApp(
        '/custom-vr.html',
        params,
      );

      expect(window.open).toHaveBeenCalledWith(
        '/custom-vr.html?caseId=123&mode=edit',
        'NightingaleVR',
        'width=1200,height=800,scrollbars=yes,resizable=yes',
      );
    });

    test('should handle popup blocking', () => {
      global.window.open = jest.fn(() => null);

      const result = NightingaleCMSUtilities.openVRApp();
      expect(result).toBeNull();
    });

    test('should handle errors', () => {
      global.window.open = jest.fn(() => {
        throw new Error('Open failed');
      });

      const result = NightingaleCMSUtilities.openVRApp();
      expect(result).toBeNull();
    });
  });

  describe('testFinancialMigration', () => {
    test('should pass validation for valid financial data', () => {
      const result = NightingaleCMSUtilities.testFinancialMigration(mockCase);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.totalItems).toBe(5);
    });

    test('should detect missing financial sections', () => {
      const caseWithMissingSection = {
        financials: {
          resources: [{ type: 'Checking', value: 1000 }],
          // income and expenses missing
        },
      };

      const result = NightingaleCMSUtilities.testFinancialMigration(
        caseWithMissingSection,
      );

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Missing income section');
      expect(result.warnings).toContain('Missing expenses section');
    });

    test('should detect invalid financial structure', () => {
      const caseWithInvalidStructure = {
        financials: {
          resources: 'not an array',
          income: [{ type: 'Salary', value: 1000 }],
          expenses: [{ type: 'Rent', value: 500 }],
        },
      };

      const result = NightingaleCMSUtilities.testFinancialMigration(
        caseWithInvalidStructure,
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('resources is not an array');
    });

    test('should detect missing required fields', () => {
      const caseWithMissingFields = {
        financials: {
          resources: [
            { type: 'Checking' }, // missing value
            { value: 1000 }, // missing type
          ],
          income: [],
          expenses: [],
        },
      };

      const result = NightingaleCMSUtilities.testFinancialMigration(
        caseWithMissingFields,
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Item 1: Missing required field 'value'");
      expect(result.errors).toContain("Item 2: Missing required field 'type'");
    });

    test('should detect invalid numeric values', () => {
      const caseWithInvalidValues = {
        financials: {
          resources: [{ type: 'Checking', value: 'not a number' }],
          income: [],
          expenses: [],
        },
      };

      const result = NightingaleCMSUtilities.testFinancialMigration(
        caseWithInvalidValues,
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        "Item 1: Invalid numeric value 'not a number'",
      );
    });

    test('should return error for null case', () => {
      const result = NightingaleCMSUtilities.testFinancialMigration(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No case object provided');
    });
  });

  describe('private methods', () => {
    test('_calculateCompleteness should return correct percentage', () => {
      // Access private method for testing
      const completeness =
        NightingaleCMSUtilities._calculateCompleteness(mockCase);
      expect(completeness).toBeGreaterThan(50);
      expect(completeness).toBeLessThanOrEqual(100);
    });

    test('_calculateCompleteness should return 0 for null case', () => {
      const completeness = NightingaleCMSUtilities._calculateCompleteness(null);
      expect(completeness).toBe(0);
    });
  });
});
