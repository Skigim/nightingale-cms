/**
 * @jest-environment jsdom
 */

import NightingaleDocumentGeneration from '../../src/services/nightingale.documentgeneration.js';

// Mock dependencies
jest.mock('../../src/services/nightingale.placeholders.js', () => ({
  processPlaceholders: jest.fn((template, activeCase, data, replacements) => {
    return `Processed: ${template} with ${JSON.stringify(replacements)}`;
  }),
}));

jest.mock('../../src/services/nightingale.templates.js', () => ({
  getTemplateById: jest.fn((data, id) => {
    if (id === 1) {
      return {
        id: 1,
        name: 'Test Template',
        content: 'Template content for {ItemType}',
      };
    }
    return null;
  }),
}));

jest.mock('../../src/services/nightingale.dayjs.js', () => ({
  formatToday: jest.fn(() => '2024-03-15'),
}));

jest.mock('../../src/services/nightingale.toast.js', () => ({
  show: jest.fn(),
}));

jest.mock('../../src/services/nightingale.logger.js', () => ({
  get: jest.fn(() => ({
    error: jest.fn(),
  })),
}));

describe('NightingaleDocumentGeneration', () => {
  const mockData = {
    vrRequests: [
      {
        id: 1,
        title: 'Test VR Request 1',
        caseId: 1,
        templateId: 1,
        status: 'Draft',
        createdDate: '2024-01-01',
        modifiedDate: '2024-01-01',
        content: 'Test content 1',
        financialItems: [],
        customReplacements: {},
      },
      {
        id: 2,
        title: 'Test VR Request 2',
        caseId: 2,
        templateId: 2,
        status: 'Completed',
        createdDate: '2024-01-02',
        modifiedDate: '2024-01-02',
        content: 'Test content 2',
        financialItems: [],
        customReplacements: {},
      },
    ],
    cases: [
      {
        id: 1,
        caseNumber: 'CASE-001',
        personId: 1,
        organizationId: 1,
      },
      {
        id: 2,
        caseNumber: 'CASE-002',
        personId: 2,
        organizationId: 2,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock file service
    global.window = {
      ...global.window,
      NightingaleFileService: {
        saveFile: jest.fn().mockResolvedValue(true),
      },
    };
  });

  describe('getVRRequests', () => {
    test('should return VR requests array from data', () => {
      const result = NightingaleDocumentGeneration.getVRRequests(mockData);
      expect(result).toEqual(mockData.vrRequests);
    });

    test('should return empty array when no VR requests', () => {
      const result = NightingaleDocumentGeneration.getVRRequests({});
      expect(result).toEqual([]);
    });

    test('should handle null data', () => {
      const result = NightingaleDocumentGeneration.getVRRequests(null);
      expect(result).toEqual([]);
    });
  });

  describe('getVRRequestById', () => {
    test('should return VR request by ID', () => {
      const result = NightingaleDocumentGeneration.getVRRequestById(
        mockData,
        1,
      );
      expect(result).toEqual(mockData.vrRequests[0]);
    });

    test('should return null for non-existent ID', () => {
      const result = NightingaleDocumentGeneration.getVRRequestById(
        mockData,
        999,
      );
      expect(result).toBeNull();
    });
  });

  describe('validateVRRequest', () => {
    test('should validate correct VR request data', () => {
      const requestData = {
        title: 'Valid VR Request',
        caseId: 1,
        templateId: 1,
      };

      const result =
        NightingaleDocumentGeneration.validateVRRequest(requestData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should return errors for invalid VR request data', () => {
      const requestData = {
        title: '',
        caseId: null,
        templateId: 'invalid',
      };

      const result =
        NightingaleDocumentGeneration.validateVRRequest(requestData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Request title is required.');
      expect(result.errors.caseId).toBe('Case ID is required.');
      expect(result.errors.templateId).toBe('Template ID must be a number.');
    });

    test('should validate title length constraints', () => {
      const shortTitle = {
        title: 'AB',
        caseId: 1,
      };

      const longTitle = {
        title: 'A'.repeat(201),
        caseId: 1,
      };

      const shortResult =
        NightingaleDocumentGeneration.validateVRRequest(shortTitle);
      const longResult =
        NightingaleDocumentGeneration.validateVRRequest(longTitle);

      expect(shortResult.errors.title).toBe(
        'Request title must be at least 3 characters.',
      );
      expect(longResult.errors.title).toBe(
        'Request title must be no more than 200 characters.',
      );
    });
  });

  describe('createVRRequest', () => {
    test('should create valid VR request successfully', async () => {
      const requestData = {
        title: 'New VR Request',
        caseId: 1,
        templateId: 1,
        financialItems: [],
        customReplacements: { CustomValue: 'Test' },
      };

      const result = await NightingaleDocumentGeneration.createVRRequest(
        mockData,
        requestData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrRequests).toHaveLength(3);
      expect(result.request.id).toBe(3);
      expect(result.request.title).toBe('New VR Request');
      expect(result.request.status).toBe('Draft');
      expect(result.request.createdDate).toBe('2024-03-15');
    });

    test('should fail validation for invalid VR request', async () => {
      const requestData = {
        title: '',
        caseId: null,
      };

      const result = await NightingaleDocumentGeneration.createVRRequest(
        mockData,
        requestData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.errors).toBeDefined();
    });

    test('should handle missing vrRequests array', async () => {
      const emptyData = {};
      const requestData = {
        title: 'New VR Request',
        caseId: 1,
      };

      const result = await NightingaleDocumentGeneration.createVRRequest(
        emptyData,
        requestData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrRequests).toHaveLength(1);
      expect(result.request.id).toBe(1);
    });

    test('should generate content when template is provided', async () => {
      const requestData = {
        title: 'New VR Request',
        caseId: 1,
        templateId: 1,
        customReplacements: { CustomValue: 'Test' },
      };

      const result = await NightingaleDocumentGeneration.createVRRequest(
        mockData,
        requestData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.request.content).toContain('Processed:');
    });
  });

  describe('updateVRRequest', () => {
    test('should update existing VR request successfully', async () => {
      const updateData = {
        title: 'Updated VR Request',
        caseId: 2,
        templateId: 1,
        financialItems: [],
        customReplacements: {},
      };

      const result = await NightingaleDocumentGeneration.updateVRRequest(
        mockData,
        1,
        updateData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.request.title).toBe('Updated VR Request');
      expect(result.request.caseId).toBe(2);
      expect(result.request.modifiedDate).toBe('2024-03-15');
    });

    test('should fail for non-existent VR request', async () => {
      const updateData = {
        title: 'Updated VR Request',
        caseId: 2,
      };

      const result = await NightingaleDocumentGeneration.updateVRRequest(
        mockData,
        999,
        updateData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('VR Request not found');
    });

    test('should fail validation for invalid update data', async () => {
      const updateData = {
        title: '',
        caseId: null,
      };

      const result = await NightingaleDocumentGeneration.updateVRRequest(
        mockData,
        1,
        updateData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('deleteVRRequest', () => {
    test('should delete existing VR request successfully', async () => {
      const result = await NightingaleDocumentGeneration.deleteVRRequest(
        mockData,
        1,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrRequests).toHaveLength(1);
      expect(result.request.id).toBe(1);
    });

    test('should fail for non-existent VR request', async () => {
      const result = await NightingaleDocumentGeneration.deleteVRRequest(
        mockData,
        999,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('VR Request not found');
    });
  });

  describe('generateFinancialDocumentContent', () => {
    test('should generate content for financial items', () => {
      const financialItems = [
        {
          type: 'Checking Account',
          owner: 'John Doe',
          location: 'Bank of America',
          value: 1000,
          description: 'Primary checking account',
        },
        {
          type: 'Savings Account',
          owner: 'Jane Doe',
          location: 'Wells Fargo',
          value: 5000,
          description: 'Emergency savings',
        },
      ];

      const result =
        NightingaleDocumentGeneration.generateFinancialDocumentContent(
          mockData,
          financialItems,
          1,
          1,
          { CustomValue: 'Test' },
        );

      expect(result).toContain('Processed:');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle missing template', () => {
      const financialItems = [{ type: 'Checking Account', value: 1000 }];

      const result =
        NightingaleDocumentGeneration.generateFinancialDocumentContent(
          mockData,
          financialItems,
          999, // Non-existent template
          1,
        );

      expect(result).toBe('');
    });

    test('should handle missing case', () => {
      const financialItems = [{ type: 'Checking Account', value: 1000 }];

      const result =
        NightingaleDocumentGeneration.generateFinancialDocumentContent(
          mockData,
          financialItems,
          1,
          999, // Non-existent case
        );

      expect(result).toBe('');
    });
  });

  describe('private methods', () => {
    test('_getNextVRRequestId should return correct next ID', () => {
      const nextId =
        NightingaleDocumentGeneration._getNextVRRequestId(mockData);
      expect(nextId).toBe(3);
    });

    test('_getNextVRRequestId should return 1 for empty requests', () => {
      const emptyData = { vrRequests: [] };
      const nextId =
        NightingaleDocumentGeneration._getNextVRRequestId(emptyData);
      expect(nextId).toBe(1);
    });

    test('_findCaseById should find case correctly', () => {
      const caseObj = NightingaleDocumentGeneration._findCaseById(mockData, 1);
      expect(caseObj).toEqual(mockData.cases[0]);
    });

    test('_findCaseById should return null for non-existent case', () => {
      const caseObj = NightingaleDocumentGeneration._findCaseById(
        mockData,
        999,
      );
      expect(caseObj).toBeNull();
    });

    test('_formatCurrency should format currency correctly', () => {
      expect(NightingaleDocumentGeneration._formatCurrency(1234.56)).toBe(
        '$1,234.56',
      );
      expect(NightingaleDocumentGeneration._formatCurrency('1000')).toBe(
        '$1,000.00',
      );
      expect(NightingaleDocumentGeneration._formatCurrency(null)).toBe('$0.00');
      expect(NightingaleDocumentGeneration._formatCurrency('')).toBe('$0.00');
      expect(NightingaleDocumentGeneration._formatCurrency('invalid')).toBe(
        '$0.00',
      );
    });

    test('_deepClone should clone objects correctly', () => {
      const original = {
        string: 'test',
        number: 123,
        array: [1, 2, 3],
        object: { nested: 'value' },
        date: new Date('2024-01-01'),
      };

      const cloned = NightingaleDocumentGeneration._deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.array).not.toBe(original.array);
      expect(cloned.object).not.toBe(original.object);
      expect(cloned.date).not.toBe(original.date);
    });

    test('_getFileService should return file service from window', () => {
      const fileService = NightingaleDocumentGeneration._getFileService();
      expect(fileService).toBe(global.window.NightingaleFileService);
    });
  });

  describe('error handling', () => {
    test('should handle file service errors gracefully', async () => {
      // Create a new mock that throws an error
      const mockFileService = {
        saveFile: jest.fn().mockRejectedValue(new Error('File save failed')),
      };

      // Temporarily replace the file service
      const originalFileService = global.window.NightingaleFileService;
      global.window.NightingaleFileService = mockFileService;

      const requestData = {
        title: 'New VR Request',
        caseId: 1,
      };

      const result = await NightingaleDocumentGeneration.createVRRequest(
        mockData,
        requestData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('File save failed');

      // Restore original file service
      global.window.NightingaleFileService = originalFileService;
    });

    test('should handle toast service errors gracefully', async () => {
      // Mock toast service to throw error
      const NightingaleToast = require('../../src/services/nightingale.toast.js');
      NightingaleToast.show.mockImplementationOnce(() => {
        throw new Error('Toast failed');
      });

      const requestData = {
        title: 'New VR Request',
        caseId: 1,
      };

      // Should not throw error even if toast fails
      const result = await NightingaleDocumentGeneration.createVRRequest(
        mockData,
        requestData,
        {
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
    });
  });
});
