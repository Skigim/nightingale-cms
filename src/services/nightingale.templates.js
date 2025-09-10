/**
 * Nightingale Template Management Service
 *
 * Provides comprehensive template management functionality for the Nightingale CMS.
 * Handles template CRUD operations, category management, validation, and search
 * with integration to file services and toast notifications.
 *
 * Features:
 * - Template CRUD operations with validation
 * - Category management and organization
 * - Duplicate name checking and validation
 * - File persistence with immediate sync
 * - BroadcastChannel integration for CMS synchronization
 * - Template search and filtering capabilities
 * - Auto-increment ID management
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

import NightingaleDayJS from './nightingale.dayjs.js';
import NightingaleToast from './nightingale.toast.js';
import NightingaleLogger from './nightingale.logger.js';

/**
 * Template Management Service
 */
class NightingaleTemplates {
  constructor() {
    this.dateService = NightingaleDayJS;
    this.toastService = NightingaleToast;
    this.logger = NightingaleLogger.get('templates');
    
    // BroadcastChannel for CMS synchronization
    this.broadcastChannel = null;
    
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      this.broadcastChannel = new BroadcastChannel('nightingale-templates');
    }
  }

  /**
   * Get all templates from data
   * @param {Object} data - Full nightingale data object
   * @returns {Array} Array of template objects
   */
  getTemplates(data) {
    return data?.vrTemplates || [];
  }

  /**
   * Get all categories from data
   * @param {Object} data - Full nightingale data object
   * @returns {Array} Array of category strings
   */
  getCategories(data) {
    return data?.vrCategories || [];
  }

  /**
   * Get template by ID
   * @param {Object} data - Full nightingale data object
   * @param {number} templateId - Template ID to find
   * @returns {Object|null} Template object or null if not found
   */
  getTemplateById(data, templateId) {
    const templates = this.getTemplates(data);
    return templates.find((template) => template.id === templateId) || null;
  }

  /**
   * Get templates by category
   * @param {Object} data - Full nightingale data object
   * @param {string} category - Category to filter by
   * @returns {Array} Array of templates in the specified category
   */
  getTemplatesByCategory(data, category) {
    const templates = this.getTemplates(data);
    return templates.filter((template) => template.category === category);
  }

  /**
   * Validate template data
   * @param {Object} templateData - Template data to validate
   * @param {Object} fullData - Full nightingale data (for duplicate checking)
   * @param {number|null} excludeId - Template ID to exclude from duplicate check (for editing)
   * @returns {Object} Validation result: { isValid: boolean, errors: Object }
   */
  validateTemplate(templateData, fullData, excludeId = null) {
    const errors = {};

    // Name validation
    if (!templateData.name || !templateData.name.trim()) {
      errors.name = 'Template name is required.';
    } else if (templateData.name.length < 3) {
      errors.name = 'Template name must be at least 3 characters.';
    } else if (templateData.name.length > 100) {
      errors.name = 'Template name must be no more than 100 characters.';
    }

    // Category validation
    if (!templateData.category) {
      errors.category = 'Please select a category.';
    }

    // Content validation
    if (!templateData.content || !templateData.content.trim()) {
      errors.content = 'Template content is required.';
    } else if (templateData.content.length < 10) {
      errors.content = 'Template content must be at least 10 characters.';
    }

    // Duplicate name check
    if (templateData.name && templateData.name.trim()) {
      const templates = this.getTemplates(fullData);
      const duplicate = templates.find(
        (template) =>
          template.name.toLowerCase() === templateData.name.toLowerCase() &&
          template.id !== excludeId,
      );
      if (duplicate) {
        errors.name = 'A template with this name already exists.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Add a new template
   * @param {Object} data - Full nightingale data object
   * @param {Object} templateData - Template data to add
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async addTemplate(data, templateData, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Validate template data
      const validation = this.validateTemplate(templateData, data);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        };
      }

      // Create new data object
      const newData = this._deepClone(data);

      // Initialize templates array if it doesn't exist
      if (!newData.vrTemplates) {
        newData.vrTemplates = [];
      }

      // Generate new ID
      const newId = this._getNextTemplateId(newData);

      // Create new template
      const newTemplate = {
        id: newId,
        name: templateData.name.trim(),
        category: templateData.category,
        content: templateData.content.trim(),
        createdDate: this.dateService.formatToday(),
        modifiedDate: this.dateService.formatToday(),
      };

      // Add template to data
      newData.vrTemplates.push(newTemplate);

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Broadcast change for CMS sync
      this._broadcastChange('template-added', newTemplate);

      // Show success toast
      if (showToast) {
        this._showToast('Template added successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        template: newTemplate,
      };
    } catch (error) {
      this.logger.error('Template addition failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update an existing template
   * @param {Object} data - Full nightingale data object
   * @param {number} templateId - ID of template to update
   * @param {Object} templateData - Updated template data
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async updateTemplate(data, templateId, templateData, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Validate template data (exclude current template from duplicate check)
      const validation = this.validateTemplate(templateData, data, templateId);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        };
      }

      // Create new data object
      const newData = this._deepClone(data);

      // Find template to update
      const templateIndex = newData.vrTemplates?.findIndex(
        (template) => template.id === templateId,
      );

      if (templateIndex === -1) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Update template
      const updatedTemplate = {
        ...newData.vrTemplates[templateIndex],
        name: templateData.name.trim(),
        category: templateData.category,
        content: templateData.content.trim(),
        modifiedDate: this.dateService.formatToday(),
      };

      newData.vrTemplates[templateIndex] = updatedTemplate;

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Broadcast change for CMS sync
      this._broadcastChange('template-updated', updatedTemplate);

      // Show success toast
      if (showToast) {
        this._showToast('Template updated successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        template: updatedTemplate,
      };
    } catch (error) {
      this.logger.error('Template update failed', { error: error.message, templateId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a template
   * @param {Object} data - Full nightingale data object
   * @param {number} templateId - ID of template to delete
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async deleteTemplate(data, templateId, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Create new data object
      const newData = this._deepClone(data);

      // Find template to delete
      const templateIndex = newData.vrTemplates?.findIndex(
        (template) => template.id === templateId,
      );

      if (templateIndex === -1) {
        return {
          success: false,
          error: 'Template not found',
        };
      }

      // Get template before deletion for broadcast
      const deletedTemplate = newData.vrTemplates[templateIndex];

      // Remove template
      newData.vrTemplates.splice(templateIndex, 1);

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Broadcast change for CMS sync
      this._broadcastChange('template-deleted', deletedTemplate);

      // Show success toast
      if (showToast) {
        this._showToast('Template deleted successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        template: deletedTemplate,
      };
    } catch (error) {
      this.logger.error('Template deletion failed', { error: error.message, templateId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add a new category
   * @param {Object} data - Full nightingale data object
   * @param {string} categoryName - Name of category to add
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async addCategory(data, categoryName, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Validate category name
      if (!categoryName || !categoryName.trim()) {
        return {
          success: false,
          error: 'Category name is required',
        };
      }

      const trimmedName = categoryName.trim();

      // Check for duplicate
      const categories = this.getCategories(data);
      if (categories.includes(trimmedName)) {
        return {
          success: false,
          error: 'Category already exists',
        };
      }

      // Create new data object
      const newData = this._deepClone(data);

      // Initialize categories array if it doesn't exist
      if (!newData.vrCategories) {
        newData.vrCategories = [];
      }

      // Add category
      newData.vrCategories.push(trimmedName);

      // Sort categories alphabetically
      newData.vrCategories.sort();

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Broadcast change for CMS sync
      this._broadcastChange('category-added', { name: trimmedName });

      // Show success toast
      if (showToast) {
        this._showToast('Category added successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        category: trimmedName,
      };
    } catch (error) {
      this.logger.error('Category addition failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a category
   * @param {Object} data - Full nightingale data object
   * @param {string} categoryName - Name of category to delete
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean, reassignTo?: string }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async deleteCategory(data, categoryName, options = {}) {
    const { showToast = true, saveFile = true, reassignTo = null } = options;

    try {
      // Create new data object
      const newData = this._deepClone(data);

      // Check if category exists
      const categoryIndex = newData.vrCategories?.indexOf(categoryName);
      if (categoryIndex === -1) {
        return {
          success: false,
          error: 'Category not found',
        };
      }

      // Handle templates in this category
      const templatesInCategory = this.getTemplatesByCategory(newData, categoryName);
      if (templatesInCategory.length > 0) {
        if (reassignTo) {
          // Reassign templates to new category
          newData.vrTemplates?.forEach((template) => {
            if (template.category === categoryName) {
              template.category = reassignTo;
              template.modifiedDate = this.dateService.formatToday();
            }
          });
        } else {
          return {
            success: false,
            error: `Cannot delete category with ${templatesInCategory.length} templates. Please reassign or delete templates first.`,
            templatesCount: templatesInCategory.length,
          };
        }
      }

      // Remove category
      newData.vrCategories.splice(categoryIndex, 1);

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Broadcast change for CMS sync
      this._broadcastChange('category-deleted', { name: categoryName, reassignTo });

      // Show success toast
      if (showToast) {
        this._showToast('Category deleted successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        category: categoryName,
        reassignedTemplates: templatesInCategory.length,
      };
    } catch (error) {
      this.logger.error('Category deletion failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Search templates by name or content
   * @param {Object} data - Full nightingale data object
   * @param {string} searchTerm - Search term
   * @returns {Array} Array of matching templates
   */
  searchTemplates(data, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {
      return this.getTemplates(data);
    }

    const templates = this.getTemplates(data);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return templates.filter((template) => {
      const nameMatch = template.name.toLowerCase().includes(lowerSearchTerm);
      const contentMatch = template.content.toLowerCase().includes(lowerSearchTerm);
      return nameMatch || contentMatch;
    });
  }

  /**
   * Get the next available template ID
   * @param {Object} data - Full nightingale data object
   * @returns {number} Next available ID
   * @private
   */
  _getNextTemplateId(data) {
    const templates = this.getTemplates(data);
    if (templates.length === 0) {
      return 1;
    }

    const maxId = Math.max(...templates.map((template) => template.id || 0));
    return maxId + 1;
  }

  /**
   * Deep clone an object
   * @param {any} obj - Object to clone
   * @returns {any} Cloned object
   * @private
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this._deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this._deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Get file service for data persistence
   * @returns {Object|null} File service instance
   * @private
   */
  _getFileService() {
    if (typeof window !== 'undefined') {
      return window.NightingaleFileService || window.FileService || null;
    }
    return null;
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   * @private
   */
  _showToast(message, type = 'info') {
    try {
      this.toastService.show(message, type);
    } catch (error) {
      // Fallback to console if toast service unavailable
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Broadcast change for CMS synchronization
   * @param {string} action - Action type
   * @param {Object} data - Change data
   * @private
   */
  _broadcastChange(action, data) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'template-change',
          action,
          data,
          timestamp: Date.now(),
        });
      } catch (error) {
        this.logger.warn('Failed to broadcast template change', { error: error.message });
      }
    }
  }
}

// Create singleton instance
const templateService = new NightingaleTemplates();

// Backward compatibility - expose to window if available
if (typeof window !== 'undefined') {
  window.NightingaleTemplateService = templateService;
  window.NightingaleTemplates = templateService;

  // Register with component system if available
  window.NightingaleServices = window.NightingaleServices || {};
  window.NightingaleServices.templateService = templateService;
}

// ES6 Module Exports
export default templateService;
export const {
  getTemplates,
  getCategories,
  getTemplateById,
  getTemplatesByCategory,
  validateTemplate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  addCategory,
  deleteCategory,
  searchTemplates,
} = templateService;