/**
 * Nightingale Document Generation Service
 *
 * Provides core document generation functionality for the Nightingale CMS.
 * Handles VR request creation, template processing, and document compilation
 * with integration to placeholders, templates, and file services.
 *
 * Features:
 * - VR Request creation and management
 * - Document content generation using templates and placeholders
 * - Financial item processing for verification requests
 * - Content compilation for multiple items/templates
 * - VR Request CRUD operations
 * - Status tracking and updates
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

import NightingalePlaceholders from './nightingale.placeholders.js';
import NightingaleTemplates from './nightingale.templates.js';
import NightingaleDayJS from './nightingale.dayjs.js';
import NightingaleToast from './nightingale.toast.js';
import NightingaleLogger from './nightingale.logger.js';
import { getFileService } from './fileServiceProvider.js';

/**
 * Document Generation Service
 */
class NightingaleDocumentGeneration {
  constructor() {
    this.placeholderService = NightingalePlaceholders;
    this.templateService = NightingaleTemplates;
    this.dateService = NightingaleDayJS;
    this.toastService = NightingaleToast;
    this.logger = NightingaleLogger.get('documentgeneration');
  }

  /**
   * Get all VR requests from data
   * @param {Object} data - Full nightingale data object
   * @returns {Array} Array of VR request objects
   */
  getVRRequests(data) {
    return data?.vrRequests || [];
  }

  /**
   * Get VR request by ID
   * @param {Object} data - Full nightingale data object
   * @param {number} requestId - VR request ID to find
   * @returns {Object|null} VR request object or null if not found
   */
  getVRRequestById(data, requestId) {
    const requests = this.getVRRequests(data);
    return requests.find((request) => request.id === requestId) || null;
  }

  /**
   * Create a new VR request
   * @param {Object} data - Full nightingale data object
   * @param {Object} requestData - VR request data
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async createVRRequest(data, requestData, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Validate request data
      const validation = this.validateVRRequest(requestData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        };
      }

      // Create new data object
      const newData = this._deepClone(data);

      // Initialize VR requests array if it doesn't exist
      if (!newData.vrRequests) {
        newData.vrRequests = [];
      }

      // Generate new ID
      const newId = this._getNextVRRequestId(newData);

      // Create new VR request
      const newRequest = {
        id: newId,
        title: requestData.title.trim(),
        caseId: requestData.caseId,
        templateId: requestData.templateId,
        status: 'Draft',
        createdDate: this.dateService.formatToday(),
        modifiedDate: this.dateService.formatToday(),
        content: '',
        financialItems: requestData.financialItems || [],
        customReplacements: requestData.customReplacements || {},
      };

      // Generate content if template is provided
      if (requestData.templateId) {
        const template = this.templateService.getTemplateById(
          data,
          requestData.templateId,
        );
        if (template) {
          const activeCase = this._findCaseById(data, requestData.caseId);
          if (activeCase) {
            newRequest.content = this.placeholderService.processPlaceholders(
              template.content,
              activeCase,
              data,
              requestData.customReplacements,
            );
          }
        }
      }

      // Add request to data
      newData.vrRequests.push(newRequest);

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Show success toast
      if (showToast) {
        this._showToast('VR Request created successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        request: newRequest,
      };
    } catch (error) {
      this.logger.error('VR Request creation failed', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update an existing VR request
   * @param {Object} data - Full nightingale data object
   * @param {number} requestId - ID of VR request to update
   * @param {Object} requestData - Updated VR request data
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async updateVRRequest(data, requestId, requestData, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Validate request data
      const validation = this.validateVRRequest(requestData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        };
      }

      // Create new data object
      const newData = this._deepClone(data);

      // Find request to update
      const requestIndex = newData.vrRequests?.findIndex(
        (request) => request.id === requestId,
      );

      if (requestIndex === -1) {
        return {
          success: false,
          error: 'VR Request not found',
        };
      }

      // Update request
      const updatedRequest = {
        ...newData.vrRequests[requestIndex],
        title: requestData.title.trim(),
        caseId: requestData.caseId,
        templateId: requestData.templateId,
        modifiedDate: this.dateService.formatToday(),
        financialItems: requestData.financialItems || [],
        customReplacements: requestData.customReplacements || {},
      };

      // Regenerate content if template changed
      if (requestData.templateId) {
        const template = this.templateService.getTemplateById(
          data,
          requestData.templateId,
        );
        if (template) {
          const activeCase = this._findCaseById(data, requestData.caseId);
          if (activeCase) {
            updatedRequest.content =
              this.placeholderService.processPlaceholders(
                template.content,
                activeCase,
                data,
                requestData.customReplacements,
              );
          }
        }
      }

      newData.vrRequests[requestIndex] = updatedRequest;

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Show success toast
      if (showToast) {
        this._showToast('VR Request updated successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        request: updatedRequest,
      };
    } catch (error) {
      this.logger.error('VR Request update failed', {
        error: error.message,
        requestId,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a VR request
   * @param {Object} data - Full nightingale data object
   * @param {number} requestId - ID of VR request to delete
   * @param {Object} options - Options: { showToast?: boolean, saveFile?: boolean }
   * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
   */
  async deleteVRRequest(data, requestId, options = {}) {
    const { showToast = true, saveFile = true } = options;

    try {
      // Create new data object
      const newData = this._deepClone(data);

      // Find request to delete
      const requestIndex = newData.vrRequests?.findIndex(
        (request) => request.id === requestId,
      );

      if (requestIndex === -1) {
        return {
          success: false,
          error: 'VR Request not found',
        };
      }

      // Get request before deletion
      const deletedRequest = newData.vrRequests[requestIndex];

      // Remove request
      newData.vrRequests.splice(requestIndex, 1);

      // Save file if requested
      if (saveFile && this._getFileService()) {
        await this._getFileService().saveFile(newData);
      }

      // Show success toast
      if (showToast) {
        this._showToast('VR Request deleted successfully.', 'success');
      }

      return {
        success: true,
        data: newData,
        request: deletedRequest,
      };
    } catch (error) {
      this.logger.error('VR Request deletion failed', {
        error: error.message,
        requestId,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate document content for financial items
   * @param {Object} data - Full nightingale data object
   * @param {Array} financialItems - Array of financial items
   * @param {number} templateId - Template ID to use
   * @param {number} caseId - Case ID for context
   * @param {Object} customReplacements - Custom placeholder replacements
   * @returns {string} Generated document content
   */
  generateFinancialDocumentContent(
    data,
    financialItems,
    templateId,
    caseId,
    customReplacements = {},
  ) {
    try {
      const template = this.templateService.getTemplateById(data, templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const activeCase = this._findCaseById(data, caseId);
      if (!activeCase) {
        throw new Error('Case not found');
      }

      let content = '';

      // Generate content for each financial item
      financialItems.forEach((item, index) => {
        // Create custom replacements for this item
        const itemReplacements = {
          ItemType: item.type || '',
          ItemOwner: item.owner || '',
          ItemLocation: item.location || '',
          ItemValue: this._formatCurrency(item.value || 0),
          ItemDescription: item.description || '',
          ItemNumber: (index + 1).toString(),
          ...customReplacements,
        };

        // Process template with item-specific replacements
        const itemContent = this.placeholderService.processPlaceholders(
          template.content,
          activeCase,
          data,
          itemReplacements,
        );

        content += itemContent + '\n\n';
      });

      return content.trim();
    } catch (error) {
      this.logger.error('Financial document generation failed', {
        error: error.message,
      });
      return '';
    }
  }

  /**
   * Validate VR request data
   * @param {Object} requestData - VR request data to validate
   * @returns {Object} Validation result: { isValid: boolean, errors: Object }
   */
  validateVRRequest(requestData) {
    const errors = {};

    // Title validation
    if (!requestData.title || !requestData.title.trim()) {
      errors.title = 'Request title is required.';
    } else if (requestData.title.length < 3) {
      errors.title = 'Request title must be at least 3 characters.';
    } else if (requestData.title.length > 200) {
      errors.title = 'Request title must be no more than 200 characters.';
    }

    // Case ID validation
    if (!requestData.caseId) {
      errors.caseId = 'Case ID is required.';
    }

    // Template ID validation (optional)
    if (requestData.templateId && typeof requestData.templateId !== 'number') {
      errors.templateId = 'Template ID must be a number.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Get the next available VR request ID
   * @param {Object} data - Full nightingale data object
   * @returns {number} Next available ID
   * @private
   */
  _getNextVRRequestId(data) {
    const requests = this.getVRRequests(data);
    if (requests.length === 0) {
      return 1;
    }

    const maxId = Math.max(...requests.map((request) => request.id || 0));
    return maxId + 1;
  }

  /**
   * Find case by ID
   * @param {Object} data - Full nightingale data object
   * @param {number} caseId - Case ID to find
   * @returns {Object|null} Case object or null if not found
   * @private
   */
  _findCaseById(data, caseId) {
    const cases = data?.cases || [];
    return cases.find((caseObj) => caseObj.id === caseId) || null;
  }

  /**
   * Format currency amount
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted currency
   * @private
   */
  _formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '')
      return '$0.00';

    const numericAmount =
      typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) return '$0.00';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount);
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
      if (Object.hasOwn(obj, key)) {
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
    return getFileService();
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
}

// Create singleton instance
const documentGenerationService = new NightingaleDocumentGeneration();

// ES6 Module Exports
export default documentGenerationService;
export const {
  getVRRequests,
  getVRRequestById,
  createVRRequest,
  updateVRRequest,
  deleteVRRequest,
  generateFinancialDocumentContent,
  validateVRRequest,
} = documentGenerationService;
