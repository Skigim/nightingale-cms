/**
 * @jest-environment jsdom
 */

import NightingaleTemplates from '../../src/services/nightingale.templates.js';

// Mock dependencies
jest.mock('../../src/services/nightingale.dayjs.js', () => ({
  formatToday: jest.fn(() => '2024-03-15'),
}));

jest.mock('../../src/services/nightingale.toast.js', () => ({
  show: jest.fn(),
}));

jest.mock('../../src/services/nightingale.logger.js', () => ({
  get: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('NightingaleTemplates', () => {
  const mockData = {
    vrTemplates: [
      {
        id: 1,
        name: 'Test Template 1',
        category: 'Legal',
        content: 'This is test template content 1',
        createdDate: '2024-01-01',
        modifiedDate: '2024-01-01',
      },
      {
        id: 2,
        name: 'Test Template 2',
        category: 'Business',
        content: 'This is test template content 2',
        createdDate: '2024-01-02',
        modifiedDate: '2024-01-02',
      },
    ],
    vrCategories: ['Legal', 'Business', 'Personal'],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.BroadcastChannel
    global.BroadcastChannel = jest.fn().mockImplementation(() => ({
      postMessage: jest.fn(),
    }));

    // Mock file service
    global.window = {
      ...global.window,
      NightingaleFileService: {
        saveFile: jest.fn().mockResolvedValue(true),
      },
    };
  });

  describe('getTemplates', () => {
    test('should return templates array from data', () => {
      const result = NightingaleTemplates.getTemplates(mockData);
      expect(result).toEqual(mockData.vrTemplates);
    });

    test('should return empty array when no templates', () => {
      const result = NightingaleTemplates.getTemplates({});
      expect(result).toEqual([]);
    });

    test('should handle null data', () => {
      const result = NightingaleTemplates.getTemplates(null);
      expect(result).toEqual([]);
    });
  });

  describe('getCategories', () => {
    test('should return categories array from data', () => {
      const result = NightingaleTemplates.getCategories(mockData);
      expect(result).toEqual(mockData.vrCategories);
    });

    test('should return empty array when no categories', () => {
      const result = NightingaleTemplates.getCategories({});
      expect(result).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    test('should return template by ID', () => {
      const result = NightingaleTemplates.getTemplateById(mockData, 1);
      expect(result).toEqual(mockData.vrTemplates[0]);
    });

    test('should return null for non-existent ID', () => {
      const result = NightingaleTemplates.getTemplateById(mockData, 999);
      expect(result).toBeNull();
    });
  });

  describe('getTemplatesByCategory', () => {
    test('should return templates by category', () => {
      const result = NightingaleTemplates.getTemplatesByCategory(
        mockData,
        'Legal',
      );
      expect(result).toEqual([mockData.vrTemplates[0]]);
    });

    test('should return empty array for non-existent category', () => {
      const result = NightingaleTemplates.getTemplatesByCategory(
        mockData,
        'NonExistent',
      );
      expect(result).toEqual([]);
    });
  });

  describe('validateTemplate', () => {
    test('should validate correct template data', () => {
      const templateData = {
        name: 'Valid Template',
        category: 'Legal',
        content: 'This is valid content with enough characters',
      };

      const result = NightingaleTemplates.validateTemplate(
        templateData,
        mockData,
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('should return errors for invalid template data', () => {
      const templateData = {
        name: '',
        category: '',
        content: 'Short',
      };

      const result = NightingaleTemplates.validateTemplate(
        templateData,
        mockData,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Template name is required.');
      expect(result.errors.category).toBe('Please select a category.');
      expect(result.errors.content).toBe(
        'Template content must be at least 10 characters.',
      );
    });

    test('should detect duplicate names', () => {
      const templateData = {
        name: 'Test Template 1', // Duplicate name
        category: 'Legal',
        content: 'This is valid content',
      };

      const result = NightingaleTemplates.validateTemplate(
        templateData,
        mockData,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe(
        'A template with this name already exists.',
      );
    });

    test('should exclude current template from duplicate check', () => {
      const templateData = {
        name: 'Test Template 1',
        category: 'Legal',
        content: 'This is valid content',
      };

      const result = NightingaleTemplates.validateTemplate(
        templateData,
        mockData,
        1,
      );

      expect(result.isValid).toBe(true);
    });

    test('should validate name length constraints', () => {
      const shortName = {
        name: 'AB',
        category: 'Legal',
        content: 'Valid content',
      };

      const longName = {
        name: 'A'.repeat(101),
        category: 'Legal',
        content: 'Valid content',
      };

      const shortResult = NightingaleTemplates.validateTemplate(
        shortName,
        mockData,
      );
      const longResult = NightingaleTemplates.validateTemplate(
        longName,
        mockData,
      );

      expect(shortResult.errors.name).toBe(
        'Template name must be at least 3 characters.',
      );
      expect(longResult.errors.name).toBe(
        'Template name must be no more than 100 characters.',
      );
    });
  });

  describe('addTemplate', () => {
    test('should add valid template successfully', async () => {
      const templateData = {
        name: 'New Template',
        category: 'Legal',
        content: 'This is new template content',
      };

      const result = await NightingaleTemplates.addTemplate(
        mockData,
        templateData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrTemplates).toHaveLength(3);
      expect(result.template.id).toBe(3);
      expect(result.template.name).toBe('New Template');
      expect(result.template.createdDate).toBe('2024-03-15');
    });

    test('should fail validation for invalid template', async () => {
      const templateData = {
        name: '',
        category: '',
        content: '',
      };

      const result = await NightingaleTemplates.addTemplate(
        mockData,
        templateData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.errors).toBeDefined();
    });

    test('should handle file save with file service', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      global.window.NightingaleFileService.saveFile = mockSave;

      const templateData = {
        name: 'New Template',
        category: 'Legal',
        content: 'This is new template content',
      };

      const result = await NightingaleTemplates.addTemplate(
        mockData,
        templateData,
        {
          showToast: false,
          saveFile: true,
        },
      );

      expect(result.success).toBe(true);
      expect(mockSave).toHaveBeenCalled();
    });

    test('should handle missing vrTemplates array', async () => {
      const emptyData = {};
      const templateData = {
        name: 'New Template',
        category: 'Legal',
        content: 'This is new template content',
      };

      const result = await NightingaleTemplates.addTemplate(
        emptyData,
        templateData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrTemplates).toHaveLength(1);
      expect(result.template.id).toBe(1);
    });
  });

  describe('updateTemplate', () => {
    test('should update existing template successfully', async () => {
      const updateData = {
        name: 'Updated Template',
        category: 'Business',
        content: 'This is updated content',
      };

      const result = await NightingaleTemplates.updateTemplate(
        mockData,
        1,
        updateData,
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.template.name).toBe('Updated Template');
      expect(result.template.category).toBe('Business');
      expect(result.template.modifiedDate).toBe('2024-03-15');
    });

    test('should fail for non-existent template', async () => {
      const updateData = {
        name: 'Updated Template',
        category: 'Business',
        content: 'This is updated content',
      };

      const result = await NightingaleTemplates.updateTemplate(
        mockData,
        999,
        updateData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });

    test('should fail validation for invalid update data', async () => {
      const updateData = {
        name: '',
        category: '',
        content: '',
      };

      const result = await NightingaleTemplates.updateTemplate(
        mockData,
        1,
        updateData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('deleteTemplate', () => {
    test('should delete existing template successfully', async () => {
      const result = await NightingaleTemplates.deleteTemplate(mockData, 1, {
        showToast: false,
        saveFile: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.vrTemplates).toHaveLength(1);
      expect(result.template.id).toBe(1);
    });

    test('should fail for non-existent template', async () => {
      const result = await NightingaleTemplates.deleteTemplate(mockData, 999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template not found');
    });
  });

  describe('addCategory', () => {
    test('should add new category successfully', async () => {
      const result = await NightingaleTemplates.addCategory(
        mockData,
        'New Category',
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrCategories).toContain('New Category');
      expect(result.category).toBe('New Category');
    });

    test('should sort categories alphabetically', async () => {
      const result = await NightingaleTemplates.addCategory(
        mockData,
        'Alphabetically First',
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrCategories[0]).toBe('Alphabetically First');
    });

    test('should fail for empty category name', async () => {
      const result = await NightingaleTemplates.addCategory(mockData, '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Category name is required');
    });

    test('should fail for duplicate category', async () => {
      const result = await NightingaleTemplates.addCategory(mockData, 'Legal');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Category already exists');
    });

    test('should handle missing vrCategories array', async () => {
      const emptyData = {};
      const result = await NightingaleTemplates.addCategory(
        emptyData,
        'New Category',
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrCategories).toEqual(['New Category']);
    });
  });

  describe('deleteCategory', () => {
    test('should delete empty category successfully', async () => {
      const result = await NightingaleTemplates.deleteCategory(
        mockData,
        'Personal',
        {
          showToast: false,
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrCategories).not.toContain('Personal');
    });

    test('should fail to delete category with templates', async () => {
      const result = await NightingaleTemplates.deleteCategory(
        mockData,
        'Legal',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete category with 1 templates');
      expect(result.templatesCount).toBe(1);
    });

    test('should reassign templates when deleting category', async () => {
      const result = await NightingaleTemplates.deleteCategory(
        mockData,
        'Legal',
        {
          showToast: false,
          saveFile: false,
          reassignTo: 'Business',
        },
      );

      expect(result.success).toBe(true);
      expect(result.data.vrCategories).not.toContain('Legal');
      expect(result.reassignedTemplates).toBe(1);

      // Check that template was reassigned
      const reassignedTemplate = result.data.vrTemplates.find(
        (t) => t.id === 1,
      );
      expect(reassignedTemplate.category).toBe('Business');
      expect(reassignedTemplate.modifiedDate).toBe('2024-03-15');
    });

    test('should fail for non-existent category', async () => {
      const result = await NightingaleTemplates.deleteCategory(
        mockData,
        'NonExistent',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Category not found');
    });
  });

  describe('searchTemplates', () => {
    test('should return all templates for empty search', () => {
      const result = NightingaleTemplates.searchTemplates(mockData, '');
      expect(result).toEqual(mockData.vrTemplates);
    });

    test('should search by template name', () => {
      const result = NightingaleTemplates.searchTemplates(
        mockData,
        'Template 1',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('should search by template content', () => {
      const result = NightingaleTemplates.searchTemplates(
        mockData,
        'content 2',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test('should be case insensitive', () => {
      const result = NightingaleTemplates.searchTemplates(mockData, 'TEMPLATE');
      expect(result).toHaveLength(2);
    });

    test('should return empty array for no matches', () => {
      const result = NightingaleTemplates.searchTemplates(
        mockData,
        'nonexistent',
      );
      expect(result).toEqual([]);
    });
  });

  describe('private methods', () => {
    test('_getNextTemplateId should return correct next ID', () => {
      const nextId = NightingaleTemplates._getNextTemplateId(mockData);
      expect(nextId).toBe(3);
    });

    test('_getNextTemplateId should return 1 for empty templates', () => {
      const emptyData = { vrTemplates: [] };
      const nextId = NightingaleTemplates._getNextTemplateId(emptyData);
      expect(nextId).toBe(1);
    });

    test('_deepClone should clone objects correctly', () => {
      const original = {
        string: 'test',
        number: 123,
        array: [1, 2, 3],
        object: { nested: 'value' },
        date: new Date('2024-01-01'),
      };

      const cloned = NightingaleTemplates._deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.array).not.toBe(original.array);
      expect(cloned.object).not.toBe(original.object);
      expect(cloned.date).not.toBe(original.date);
    });

    test('_deepClone should handle null and primitives', () => {
      expect(NightingaleTemplates._deepClone(null)).toBeNull();
      expect(NightingaleTemplates._deepClone(undefined)).toBeUndefined();
      expect(NightingaleTemplates._deepClone('string')).toBe('string');
      expect(NightingaleTemplates._deepClone(123)).toBe(123);
      expect(NightingaleTemplates._deepClone(true)).toBe(true);
    });

    test('_getFileService should return file service from window', () => {
      const fileService = NightingaleTemplates._getFileService();
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

      const templateData = {
        name: 'New Template',
        category: 'Legal',
        content: 'This is new template content',
      };

      const result = await NightingaleTemplates.addTemplate(
        mockData,
        templateData,
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

      const templateData = {
        name: 'New Template',
        category: 'Legal',
        content: 'This is new template content',
      };

      // Should not throw error even if toast fails
      const result = await NightingaleTemplates.addTemplate(
        mockData,
        templateData,
        {
          saveFile: false,
        },
      );

      expect(result.success).toBe(true);
    });
  });

  describe('broadcast functionality', () => {
    test('should broadcast template changes', async () => {
      // Reset the BroadcastChannel mock
      const mockPostMessage = jest.fn();
      global.BroadcastChannel = jest.fn().mockImplementation(() => ({
        postMessage: mockPostMessage,
      }));

      // Create a new service instance to use the mocked BroadcastChannel
      const service =
        new (require('../../src/services/nightingale.templates.js').default.constructor)();

      const templateData = {
        name: 'New Template',
        category: 'Legal',
        content: 'This is new template content',
      };

      await service.addTemplate(mockData, templateData, {
        showToast: false,
        saveFile: false,
      });

      // Should have created broadcast channel
      expect(global.BroadcastChannel).toHaveBeenCalledWith(
        'nightingale-templates',
      );
    });
  });
});
