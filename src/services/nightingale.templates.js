/**
 * Nightingale Template Management Service
 *
 * Extracted from NightingaleCorrespondence.html to provide core template
 * management functionality for integration into the main CMS.
 *
 * This service handles:
 * - Template CRUD operations (Create, Read, Update, Delete)
 * - Category management
 * - Template validation
 * - Duplicate name checking
 * - File persistence with immediate sync
 * - BroadcastChannel integration for CMS synchronization
 *
 * Data Structure:
 * - Templates: { id, name, category, content }
 * - Categories: Array of strings
 * - Auto-increment ID management
 *
 * Dependencies:
 * - nightingale.fileservice.js (for persistence)
 * - nightingale.toast.js (for notifications)
 * - nightingale.dayjs.js (for timestamps)
 * - lodash (for deep cloning)
 * - BroadcastChannel (for CMS sync)
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

(function () {
  'use strict';

  /**
   * Template Management Service
   */
  class TemplateService {
    constructor() {
      this.fileService = null;
      this.toastService = null;
      this.dateUtils = null;

      // Initialize dependencies when available
      this._initializeDependencies();
    }

    /**
     * Initialize service dependencies
     * @private
     */
    _initializeDependencies() {
      if (typeof window !== 'undefined') {
        // File service for persistence
        this.fileService = window.NightingaleFileService || window.FileService;

        // Toast service for notifications
        this.toastService = window.NightingaleToast || window.showToast;

        // Date utilities
        this.dateUtils = window.dateUtils || window.dayjs;

        // Lodash for deep cloning
        this._ = window._ || window.lodash;
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
        const existingTemplate = this.getTemplates(fullData).find(
          (t) =>
            t.name.toLowerCase() === templateData.name.toLowerCase() &&
            t.id !== excludeId
        );
        if (existingTemplate) {
          errors.name = 'A template with this name already exists.';
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
      };
    }

    /**
     * Create a new template
     * @param {Object} templateData - Template data: { name, category, content }
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean }
     * @returns {Promise<Object>} Result: { success: boolean, template?: Object, data?: Object, error?: string }
     */
    async createTemplate(templateData, fullData, options = {}) {
      const { saveToFile = true, showToast = true } = options;

      try {
        // Validate template data
        const validation = this.validateTemplate(templateData, fullData);
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Validation failed',
            validationErrors: validation.errors,
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Ensure vrTemplates array exists
        newData.vrTemplates = newData.vrTemplates || [];

        // Generate new ID
        const newId =
          newData.nextVrTemplateId ||
          Math.max(...newData.vrTemplates.map((t) => t.id || 0), 0) + 1;

        // Create new template
        const newTemplate = {
          id: newId,
          name: templateData.name.trim(),
          category: templateData.category,
          content: templateData.content.trim(),
        };

        // Add template to data
        newData.vrTemplates.push(newTemplate);
        newData.nextVrTemplateId = newId + 1;

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'template_created',
            {
              templateName: newTemplate.name,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'Template created but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast('Template created and synced with CMS.', 'success');
          }
        } else if (showToast && this.toastService) {
          this._showToast('Template created successfully.', 'success');
        }

        return {
          success: true,
          template: newTemplate,
          data: newData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Update an existing template
     * @param {number} templateId - ID of template to update
     * @param {Object} templateData - Updated template data: { name, category, content }
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean }
     * @returns {Promise<Object>} Result: { success: boolean, template?: Object, data?: Object, error?: string }
     */
    async updateTemplate(templateId, templateData, fullData, options = {}) {
      const { saveToFile = true, showToast = true } = options;

      try {
        // Find existing template
        const existingTemplate = this.getTemplateById(fullData, templateId);
        if (!existingTemplate) {
          return {
            success: false,
            error: 'Template not found',
          };
        }

        // Validate template data (excluding current template from duplicate check)
        const validation = this.validateTemplate(
          templateData,
          fullData,
          templateId
        );
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Validation failed',
            validationErrors: validation.errors,
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Find and update template
        const templateIndex = newData.vrTemplates.findIndex(
          (t) => t.id === templateId
        );
        if (templateIndex === -1) {
          return {
            success: false,
            error: 'Template not found in data',
          };
        }

        const updatedTemplate = {
          ...existingTemplate,
          name: templateData.name.trim(),
          category: templateData.category,
          content: templateData.content.trim(),
        };

        newData.vrTemplates[templateIndex] = updatedTemplate;

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'template_updated',
            {
              templateName: updatedTemplate.name,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'Template updated but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast('Template updated and synced with CMS.', 'success');
          }
        } else if (showToast && this.toastService) {
          this._showToast('Template updated successfully.', 'success');
        }

        return {
          success: true,
          template: updatedTemplate,
          data: newData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Delete a template
     * @param {number} templateId - ID of template to delete
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean }
     * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
     */
    async deleteTemplate(templateId, fullData, options = {}) {
      const { saveToFile = true, showToast = true } = options;

      try {
        // Find existing template
        const existingTemplate = this.getTemplateById(fullData, templateId);
        if (!existingTemplate) {
          return {
            success: false,
            error: 'Template not found',
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Remove template
        newData.vrTemplates = newData.vrTemplates.filter(
          (t) => t.id !== templateId
        );

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'template_deleted',
            {
              templateName: existingTemplate.name,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'Template deleted but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast('Template deleted and synced with CMS.', 'success');
          }
        } else if (showToast && this.toastService) {
          this._showToast('Template deleted successfully.', 'success');
        }

        return {
          success: true,
          data: newData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Add a new category
     * @param {string} categoryName - Name of the new category
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean }
     * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
     */
    async addCategory(categoryName, fullData, options = {}) {
      const { saveToFile = true, showToast = true } = options;

      try {
        if (!categoryName || !categoryName.trim()) {
          return {
            success: false,
            error: 'Please enter a category name.',
          };
        }

        const trimmedName = categoryName.trim();
        const categories = this.getCategories(fullData);

        if (categories.includes(trimmedName)) {
          return {
            success: false,
            error: 'Category already exists.',
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Ensure vrCategories array exists
        newData.vrCategories = newData.vrCategories || [];

        // Add category and sort
        newData.vrCategories.push(trimmedName);
        newData.vrCategories.sort();

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(newData, 'category_added', {
            categoryName: trimmedName,
          });

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'Category added but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast('Category added and synced with CMS.', 'success');
          }
        } else if (showToast && this.toastService) {
          this._showToast('Category added successfully.', 'success');
        }

        return {
          success: true,
          data: newData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Remove a category (and optionally handle templates in that category)
     * @param {string} categoryName - Name of the category to remove
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean, handleTemplates: 'delete'|'move' }
     * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
     */
    async removeCategory(categoryName, fullData, options = {}) {
      const {
        saveToFile = true,
        showToast = true,
        handleTemplates = 'move',
      } = options;

      try {
        const categories = this.getCategories(fullData);

        if (!categories.includes(categoryName)) {
          return {
            success: false,
            error: 'Category not found.',
          };
        }

        // Check for templates in this category
        const templatesInCategory = this.getTemplatesByCategory(
          fullData,
          categoryName
        );

        if (templatesInCategory.length > 0 && handleTemplates === 'delete') {
          // Delete templates in this category
          return {
            success: false,
            error: `Cannot delete category. ${templatesInCategory.length} template(s) are using this category.`,
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Remove category
        newData.vrCategories = newData.vrCategories.filter(
          (cat) => cat !== categoryName
        );

        // Handle templates in this category
        if (templatesInCategory.length > 0 && handleTemplates === 'move') {
          // Move templates to a default category or remove category assignment
          newData.vrTemplates = newData.vrTemplates.map((template) => {
            if (template.category === categoryName) {
              return {
                ...template,
                category: newData.vrCategories[0] || '', // Move to first available category or empty
              };
            }
            return template;
          });
        }

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'category_removed',
            {
              categoryName: categoryName,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'Category removed but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast('Category removed and synced with CMS.', 'success');
          }
        } else if (showToast && this.toastService) {
          this._showToast('Category removed successfully.', 'success');
        }

        return {
          success: true,
          data: newData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Save data to file with CMS synchronization
     * @param {Object} data - Data to save
     * @param {string} action - Action type for broadcast
     * @param {Object} metadata - Additional metadata for broadcast
     * @returns {Promise<boolean>} Success status
     * @private
     */
    async _saveWithSync(data, action, metadata = {}) {
      try {
        const success = await this.fileService.writeFile(data);

        if (success) {
          // Send data integrity broadcast to notify CMS to refresh
          const integrityChannel = new BroadcastChannel('nightingale_suite');
          integrityChannel.postMessage({
            type: 'data_updated',
            source: 'correspondence',
            action: action,
            timestamp: this.dateUtils
              ? this.dateUtils.now()
              : new Date().toISOString(),
            ...metadata,
          });
          integrityChannel.close();

          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @private
     */
    _showToast(message, type = 'info') {
      if (typeof this.toastService === 'function') {
        this.toastService(message, type);
      } else if (
        this.toastService &&
        typeof this.toastService.show === 'function'
      ) {
        this.toastService.show(message, type);
      } else {
        // Fallback for no toast service available
      }
    }

    /**
     * Get template statistics
     * @param {Object} data - Full nightingale data object
     * @returns {Object} Statistics: { totalTemplates, categoriesCount, templatesPerCategory }
     */
    getTemplateStats(data) {
      const templates = this.getTemplates(data);
      const categories = this.getCategories(data);

      const templatesPerCategory = {};
      categories.forEach((cat) => {
        templatesPerCategory[cat] = templates.filter(
          (t) => t.category === cat
        ).length;
      });

      return {
        totalTemplates: templates.length,
        categoriesCount: categories.length,
        templatesPerCategory: templatesPerCategory,
      };
    }

    /**
     * Search templates by name or content
     * @param {Object} data - Full nightingale data object
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options: { searchContent: boolean, category?: string }
     * @returns {Array} Array of matching templates
     */
    searchTemplates(data, searchTerm, options = {}) {
      const { searchContent = true, category } = options;
      let templates = this.getTemplates(data);

      // Filter by category if specified
      if (category) {
        templates = templates.filter((t) => t.category === category);
      }

      // Return all if no search term
      if (!searchTerm || !searchTerm.trim()) {
        return templates;
      }

      const lowerSearchTerm = searchTerm.toLowerCase();

      return templates.filter((template) => {
        const nameMatch = template.name.toLowerCase().includes(lowerSearchTerm);
        const contentMatch =
          searchContent &&
          template.content.toLowerCase().includes(lowerSearchTerm);
        return nameMatch || contentMatch;
      });
    }
  }

  // Create and export service instance
  const templateService = new TemplateService();

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = templateService;
  } else if (typeof window !== 'undefined') {
    // Browser - register with global namespace
    window.NightingaleTemplateService = templateService;

    // Register with component system if available
    if (window.NightingaleServices) {
      window.NightingaleServices.templateService = templateService;
    }
  }
})(typeof self !== 'undefined' ? self : this);

// ES6 Module Export
export default (typeof window !== 'undefined' &&
  window.NightingaleTemplateService) ||
  null;
