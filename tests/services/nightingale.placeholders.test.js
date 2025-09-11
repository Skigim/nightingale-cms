/**
 * @jest-environment jsdom
 */

import NightingalePlaceholders from '../../src/services/nightingale.placeholders.js';

// Mock NightingaleDayJS
jest.mock('../../src/services/nightingale.dayjs.js', () => ({
  formatToday: jest.fn(() => '2024-03-15'),
  formatDate: jest.fn((date, format) => {
    if (format === 'MMMM D, YYYY') {
      return 'March 15, 2024';
    }
    return '2024-03-15';
  }),
  now: jest.fn(() => '2024-03-15'),
}));

describe('NightingalePlaceholders', () => {
  const mockActiveCase = {
    personId: 'person-1',
    organizationId: 'org-1',
    caseNumber: 'CASE-001',
    type: 'Application',
    status: 'Active',
    appDetails: {
      appDate: '2024-01-15',
      applicationType: 'Application',
      povertyGuidelines: '185%',
      householdSize: '4',
      totalIncome: 45000,
    },
    financials: {
      resources: [{ value: 1000 }, { value: 2000 }],
      income: [{ value: 3000 }, { value: 1500 }],
      expenses: [{ value: 500 }, { value: 800 }],
    },
  };

  const mockFullData = {
    people: [
      {
        id: 'person-1',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        middleName: 'Michael',
        ssn: '123456789',
        dateOfBirth: '1980-05-20',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
        phone: '5551234567',
        email: 'john@example.com',
        organizationId: 'org-1',
      },
    ],
    organizations: [
      {
        id: 'org-1',
        name: 'Test Organization',
        address: '456 Business Ave',
        city: 'Corporate City',
        state: 'NY',
        zipCode: '10001',
        phone: '5559876543',
        email: 'org@example.com',
        ein: '987654321',
        personnel: [
          {
            name: 'Jane Smith',
            firstName: 'Jane',
            lastName: 'Smith',
            title: 'Administrator',
            phone: '5555551234',
            email: 'jane@example.com',
          },
          {
            name: 'Bob Johnson',
            firstName: 'Bob',
            lastName: 'Johnson',
            title: 'BOM',
            phone: '5555555678',
            email: 'bob@example.com',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processPlaceholders', () => {
    test('should process date placeholders', () => {
      const template = 'Today is {TodayDate} and formatted as {TodayLong}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe(
        'Today is 2024-03-15 and formatted as March 15, 2024',
      );
    });

    test('should process person placeholders', () => {
      const template =
        'Person: {PersonName} ({PersonFirstName} {PersonLastName})';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Person: John Doe (John Doe)');
    });

    test('should process formatted person placeholders', () => {
      const template =
        'SSN: {PersonSSNFormatted}, Phone: {PersonPhoneFormatted}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('SSN: 123-45-6789, Phone: (555) 123-4567');
    });

    test('should process organization placeholders', () => {
      const template = '{OrganizationName} - EIN: {OrganizationEINFormatted}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Test Organization - EIN: 98-7654321');
    });

    test('should process contact placeholders with Administrator priority', () => {
      const template = 'Contact: {ContactName} ({ContactTitle})';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Contact: Jane Smith (Administrator)');
    });

    test('should process case placeholders', () => {
      const template = 'Case {CaseNumber} is {CaseStatus}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Case CASE-001 is Active');
    });

    test('should process financial placeholders', () => {
      const template =
        'Assets: {TotalAssetsFormatted}, Income: {TotalIncomeFormatted}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Assets: $3,000.00, Income: $4,500.00');
    });

    test('should process custom replacements', () => {
      const template = 'Custom value: {CustomPlaceholder}';
      const customReplacements = { CustomPlaceholder: 'Custom Value' };
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
        customReplacements,
      );

      expect(result).toBe('Custom value: Custom Value');
    });

    test('should leave unknown placeholders unchanged', () => {
      const template = 'Unknown: {UnknownPlaceholder}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Unknown: {UnknownPlaceholder}');
    });

    test('should handle empty values gracefully', () => {
      const caseWithEmptyValues = { ...mockActiveCase, caseNumber: '' };
      const template = 'Case: {CaseNumber}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        caseWithEmptyValues,
        mockFullData,
      );

      expect(result).toBe('Case: ');
    });

    test('should find organization from person when case organizationId is missing', () => {
      const caseWithoutOrgId = { ...mockActiveCase };
      delete caseWithoutOrgId.organizationId;

      const template = '{OrganizationName}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        caseWithoutOrgId,
        mockFullData,
      );

      expect(result).toBe('Test Organization');
    });

    test('should handle missing person', () => {
      const caseWithMissingPerson = { ...mockActiveCase, personId: 'missing' };
      const template = '{PersonName}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        caseWithMissingPerson,
        mockFullData,
      );

      expect(result).toBe('');
    });

    test('should handle missing organization', () => {
      const caseWithMissingOrg = {
        ...mockActiveCase,
        organizationId: 'missing',
      };
      const dataWithoutPerson = {
        ...mockFullData,
        people: [{ ...mockFullData.people[0], organizationId: 'missing' }],
      };

      const template = '{OrganizationName}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        caseWithMissingOrg,
        dataWithoutPerson,
      );

      expect(result).toBe('');
    });

    test('should fallback to BOM when no Administrator', () => {
      const dataWithBOM = {
        ...mockFullData,
        organizations: [
          {
            ...mockFullData.organizations[0],
            personnel: [
              {
                name: 'Bob Johnson',
                firstName: 'Bob',
                lastName: 'Johnson',
                title: 'BOM',
                phone: '5555555678',
                email: 'bob@example.com',
              },
            ],
          },
        ],
      };

      const template = '{ContactName}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        dataWithBOM,
      );

      expect(result).toBe('Bob Johnson');
    });

    // Error handling tests
    test('should return empty string for null template', () => {
      const result = NightingalePlaceholders.processPlaceholders(
        null,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('');
    });

    test('should return original template when activeCase is null', () => {
      const template = 'Test {PersonName}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        null,
        mockFullData,
      );

      expect(result).toBe('Test {PersonName}');
    });

    test('should return original template when fullData is null', () => {
      const template = 'Test {PersonName}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        null,
      );

      expect(result).toBe('Test {PersonName}');
    });

    test('should handle non-string template', () => {
      const result = NightingalePlaceholders.processPlaceholders(
        123,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe(123);
    });
  });

  describe('process method (alias)', () => {
    test('should work as alias for processPlaceholders', () => {
      const template = 'Today is {TodayDate}';
      const result = NightingalePlaceholders.process(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('Today is 2024-03-15');
    });
  });

  describe('formatting methods', () => {
    test('should format SSN correctly', () => {
      const result = NightingalePlaceholders._formatSSN('123456789');
      expect(result).toBe('123-45-6789');
    });

    test('should handle invalid SSN', () => {
      expect(NightingalePlaceholders._formatSSN('12345')).toBe('12345');
      expect(NightingalePlaceholders._formatSSN(null)).toBe('');
      expect(NightingalePlaceholders._formatSSN('')).toBe('');
    });

    test('should format EIN correctly', () => {
      const result = NightingalePlaceholders._formatEIN('987654321');
      expect(result).toBe('98-7654321');
    });

    test('should handle invalid EIN', () => {
      expect(NightingalePlaceholders._formatEIN('12345')).toBe('12345');
      expect(NightingalePlaceholders._formatEIN(null)).toBe('');
    });

    test('should format phone correctly', () => {
      const result = NightingalePlaceholders._formatPhone('5551234567');
      expect(result).toBe('(555) 123-4567');
    });

    test('should handle invalid phone', () => {
      expect(NightingalePlaceholders._formatPhone('555')).toBe('555');
      expect(NightingalePlaceholders._formatPhone(null)).toBe('');
    });

    test('should format currency correctly', () => {
      const result = NightingalePlaceholders._formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    test('should handle invalid currency', () => {
      expect(NightingalePlaceholders._formatCurrency('')).toBe('');
      expect(NightingalePlaceholders._formatCurrency('abc')).toBe('');
      expect(NightingalePlaceholders._formatCurrency(null)).toBe('');
    });

    test('should format address correctly', () => {
      const entity = {
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '90210',
      };
      const result = NightingalePlaceholders._formatAddress(entity);
      expect(result).toBe('123 Main St, Anytown, CA, 90210');
    });

    test('should handle partial address', () => {
      const entity = { city: 'Anytown', state: 'CA' };
      const result = NightingalePlaceholders._formatAddress(entity);
      expect(result).toBe('Anytown, CA');
    });

    test('should handle null entity for address', () => {
      const result = NightingalePlaceholders._formatAddress(null);
      expect(result).toBe('');
    });
  });

  describe('financial calculation methods', () => {
    test('should calculate total assets', () => {
      const result = NightingalePlaceholders._getTotalAssets(mockActiveCase);
      expect(result).toBe(3000);
    });

    test('should calculate total income', () => {
      const result = NightingalePlaceholders._getTotalIncome(mockActiveCase);
      expect(result).toBe(4500);
    });

    test('should calculate total expenses', () => {
      const result = NightingalePlaceholders._getTotalExpenses(mockActiveCase);
      expect(result).toBe(1300);
    });

    test('should handle missing financial data', () => {
      const caseWithoutFinancials = { ...mockActiveCase };
      delete caseWithoutFinancials.financials;

      expect(
        NightingalePlaceholders._getTotalAssets(caseWithoutFinancials),
      ).toBe(0);
      expect(
        NightingalePlaceholders._getTotalIncome(caseWithoutFinancials),
      ).toBe(0);
      expect(
        NightingalePlaceholders._getTotalExpenses(caseWithoutFinancials),
      ).toBe(0);
    });

    test('should handle invalid values in financial arrays', () => {
      const caseWithInvalidValues = {
        ...mockActiveCase,
        financials: {
          resources: [{ value: 'invalid' }, { value: 100 }],
          income: [{ value: null }, { value: 200 }],
          expenses: [{ value: undefined }, { value: 300 }],
        },
      };

      expect(
        NightingalePlaceholders._getTotalAssets(caseWithInvalidValues),
      ).toBe(100);
      expect(
        NightingalePlaceholders._getTotalIncome(caseWithInvalidValues),
      ).toBe(200);
      expect(
        NightingalePlaceholders._getTotalExpenses(caseWithInvalidValues),
      ).toBe(300);
    });
  });

  describe('getAvailablePlaceholders', () => {
    test('should return array of available placeholders', () => {
      const placeholders = NightingalePlaceholders.getAvailablePlaceholders();

      expect(Array.isArray(placeholders)).toBe(true);
      expect(placeholders.length).toBeGreaterThan(0);
      expect(placeholders).toContain('TodayDate');
      expect(placeholders).toContain('PersonName');
      expect(placeholders).toContain('OrganizationName');
      expect(placeholders).toContain('CaseNumber');
      expect(placeholders).toContain('TotalAssetsFormatted');
    });
  });

  describe('integration', () => {
    test('should integrate with NightingaleDayJS for date formatting', () => {
      const template = '{TodayDate} and {TodayLong}';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toBe('2024-03-15 and March 15, 2024');
    });
  });

  describe('complex scenarios', () => {
    test('should handle multiple placeholders in one template', () => {
      const template = `
        Dear {PersonFirstName} {PersonLastName},
        
        Your case {CaseNumber} has been processed.
        Organization: {OrganizationName}
        Contact: {ContactName} ({ContactPhoneFormatted})
        Total Income: {TotalIncomeFormatted}
        
        Date: {TodayLong}
      `;

      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      expect(result).toContain('Dear John Doe,');
      expect(result).toContain('Your case CASE-001 has been processed.');
      expect(result).toContain('Organization: Test Organization');
      expect(result).toContain('Contact: Jane Smith ((555) 555-1234)');
      expect(result).toContain('Total Income: $4,500.00');
      expect(result).toContain('Date: March 15, 2024');
    });

    test('should handle nested placeholder-like strings', () => {
      const template = 'This {is {nested}} should work';
      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
      );

      // Should leave nested braces as-is since they're not valid placeholders
      expect(result).toBe('This {is {nested}} should work');
    });

    test('should override default values with custom replacements', () => {
      const template = '{PersonName} and {CustomValue}';
      const customReplacements = {
        PersonName: 'Custom Name Override',
        CustomValue: 'Custom Value',
      };

      const result = NightingalePlaceholders.processPlaceholders(
        template,
        mockActiveCase,
        mockFullData,
        customReplacements,
      );

      expect(result).toBe('Custom Name Override and Custom Value');
    });
  });
});
