/**
 * Nightingale Document Generation Service
 *
 * Extracted from NightingaleCorrespondence.html to provide core document
 * generation functionality for integration into the main CMS.
 *
 * This service handles:
 * - VR Request creation and management
 * - Document content generation using templates and placeholders
 * - Financial item processing for verification requests
 * - Content compilation for multiple items/templates
 * - VR Request CRUD operations
 * - Status tracking and updates
 *
 * Dependencies:
 * - nightingale.placeholders.js (for placeholder processing)
 * - nightingale.templates.js (for template management)
 * - nightingale.fileservice.js (for persistence)
 * - nightingale.toast.js (for notifications)
 * - nightingale.dayjs.js (for date handling)
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

(function () {
  'use strict';

  /**
   * Document Generation Service
   */
  class DocumentGenerationService {
    constructor() {
      this.placeholderService = null;
      this.templateService = null;
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
        // Core services
        this.placeholderService = window.NightingalePlaceholderService;
        this.templateService = window.NightingaleTemplateService;
        this.fileService = window.NightingaleFileService || window.FileService;
        this.toastService = window.NightingaleToast || window.showToast;
        this.dateUtils = window.dateUtils || window.dayjs;

        // Lodash for deep cloning
        this._ = window._ || window.lodash;
      }
    }

    /**
     * Get all VR requests from data
     * @param {Object} data - Full nightingale data object
     * @returns {Array} Array of VR request objects
     */
    getVrRequests(data) {
      return data?.vrRequests || [];
    }

    /**
     * Get VR request by ID
     * @param {Object} data - Full nightingale data object
     * @param {number} requestId - VR request ID to find
     * @returns {Object|null} VR request object or null if not found
     */
    getVrRequestById(data, requestId) {
      const requests = this.getVrRequests(data);
      return requests.find((request) => request.id === requestId) || null;
    }

    /**
     * Get VR requests for a specific case
     * @param {Object} data - Full nightingale data object
     * @param {number} caseId - Case ID to filter by
     * @returns {Array} Array of VR requests for the case
     */
    getVrRequestsByCase(data, caseId) {
      const requests = this.getVrRequests(data);
      return requests.filter((request) => request.caseId === caseId);
    }

    /**
     * Generate document content using template and financial items
     * @param {Object} template - Template object with content
     * @param {Object} activeCase - Active case data
     * @param {Object} fullData - Full nightingale data object
     * @param {Array} selectedFinancialItems - Array of selected financial items
     * @param {Object} options - Options: { additionalPlaceholders: Object }
     * @returns {Object} Result: { success: boolean, content?: string, error?: string }
     */
    generateDocumentContent(
      template,
      activeCase,
      fullData,
      selectedFinancialItems = [],
      options = {}
    ) {
      try {
        if (!template || !template.content) {
          return {
            success: false,
            error: 'Template or template content is required',
          };
        }

        if (!this.placeholderService) {
          return {
            success: false,
            error: 'Placeholder service not available',
          };
        }

        const { additionalPlaceholders = {} } = options;
        let processedContent = '';

        if (selectedFinancialItems.length > 0) {
          // Generate content for each selected financial item
          const contentBlocks = selectedFinancialItems.map((item) => {
            const itemPlaceholders = {
              ItemName: item.type || '',
              Location: item.location || '',
              AccountNumber: item.accountNumber || '',
              Value: item.value ? `$${item.value.toFixed(2)}` : '$0.00',
              ...additionalPlaceholders,
            };

            return this.placeholderService.processPlaceholders(
              template.content,
              activeCase,
              fullData,
              itemPlaceholders
            );
          });

          processedContent = contentBlocks.join('\n\n');
        } else {
          // Generate general content without specific financial items
          processedContent = this.placeholderService.processPlaceholders(
            template.content,
            activeCase,
            fullData,
            additionalPlaceholders
          );
        }

        return {
          success: true,
          content: processedContent,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Generate document content and append to existing content
     * @param {Object} template - Template object with content
     * @param {Object} activeCase - Active case data
     * @param {Object} fullData - Full nightingale data object
     * @param {Array} selectedFinancialItems - Array of selected financial items
     * @param {string} existingContent - Existing content to append to
     * @param {Object} options - Options: { additionalPlaceholders: Object, separator: string }
     * @returns {Object} Result: { success: boolean, content?: string, itemCount?: number, error?: string }
     */
    appendDocumentContent(
      template,
      activeCase,
      fullData,
      selectedFinancialItems = [],
      existingContent = '',
      options = {}
    ) {
      try {
        const { separator = '\n\n' } = options;

        const result = this.generateDocumentContent(
          template,
          activeCase,
          fullData,
          selectedFinancialItems,
          options
        );

        if (!result.success) {
          return result;
        }

        const newContent = existingContent
          ? `${existingContent}${separator}${result.content}`
          : result.content;

        return {
          success: true,
          content: newContent,
          itemCount: selectedFinancialItems.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    /**
     * Create a new VR request
     * @param {Object} requestData - VR request data
     * @param {Object} activeCase - Active case data
     * @param {Object} fullData - Full nightingale data object
     * @param {Array} selectedFinancialItemIds - Array of selected financial item IDs
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean, updateItemStatus: boolean }
     * @returns {Promise<Object>} Result: { success: boolean, vrRequest?: Object, data?: Object, error?: string }
     */
    async createVrRequest(
      requestData,
      activeCase,
      fullData,
      selectedFinancialItemIds = [],
      options = {}
    ) {
      const {
        saveToFile = true,
        showToast = true,
        updateItemStatus = true,
      } = options;

      try {
        if (!activeCase) {
          return {
            success: false,
            error: 'Active case is required',
          };
        }

        if (!requestData.content || !requestData.content.trim()) {
          return {
            success: false,
            error: 'Request content is required',
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Ensure data structures exist
        newData.vrRequests = newData.vrRequests || [];
        newData.nextVrRequestId = newData.nextVrRequestId || 1;

        // Get client name
        const clientName =
          fullData.people?.find((p) => p.id === activeCase.personId)?.name ||
          'Unknown';

        // Calculate due date
        const dueDays = requestData.dueDays || 15;
        const dueDate = this.dateUtils
          ? this.dateUtils.addDays(dueDays)
          : new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();

        // Create new VR request
        const newVrRequest = {
          id: newData.nextVrRequestId,
          caseId: activeCase.id,
          mcn: activeCase.mcn,
          clientName: clientName,
          content: requestData.content.trim(),
          createdDate: this.dateUtils
            ? this.dateUtils.now()
            : new Date().toISOString(),
          dueDate: dueDate,
          status: 'Pending',
          financialItemIds: [...selectedFinancialItemIds],
          templateId: requestData.templateId || null,
        };

        // Add the new request
        newData.vrRequests.push(newVrRequest);
        newData.nextVrRequestId += 1;

        // Update financial item statuses if requested
        if (updateItemStatus && selectedFinancialItemIds.length > 0) {
          const caseToUpdate = newData.cases?.find(
            (c) => c.id === activeCase.id
          );
          if (caseToUpdate && caseToUpdate.financials) {
            const allFinancials = [
              ...(caseToUpdate.financials.resources || []),
              ...(caseToUpdate.financials.income || []),
              ...(caseToUpdate.financials.expenses || []),
            ];

            selectedFinancialItemIds.forEach((itemId) => {
              const itemToUpdate = allFinancials.find(
                (item) => item.id === itemId
              );
              if (itemToUpdate) {
                itemToUpdate.verificationStatus = 'VR Pending';
              }
            });
          }
        }

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'vr_request_created',
            {
              requestId: newVrRequest.id,
              caseId: activeCase.id,
              mcn: activeCase.mcn,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'VR Request created but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast(
              `VR Request #${newVrRequest.id} created and synced with CMS.`,
              'success'
            );
          }
        } else if (showToast && this.toastService) {
          this._showToast(
            `VR Request #${newVrRequest.id} created successfully!`,
            'success'
          );
        }

        return {
          success: true,
          vrRequest: newVrRequest,
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
     * Update VR request status
     * @param {number} requestId - VR request ID
     * @param {string} newStatus - New status (Pending, Approved, Rejected, Completed)
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean, notes?: string }
     * @returns {Promise<Object>} Result: { success: boolean, vrRequest?: Object, data?: Object, error?: string }
     */
    async updateVrRequestStatus(requestId, newStatus, fullData, options = {}) {
      const { saveToFile = true, showToast = true, notes } = options;

      try {
        const existingRequest = this.getVrRequestById(fullData, requestId);
        if (!existingRequest) {
          return {
            success: false,
            error: 'VR Request not found',
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Find and update request
        const requestIndex = newData.vrRequests.findIndex(
          (r) => r.id === requestId
        );
        if (requestIndex === -1) {
          return {
            success: false,
            error: 'VR Request not found in data',
          };
        }

        const updatedRequest = {
          ...existingRequest,
          status: newStatus,
          lastUpdated: this.dateUtils
            ? this.dateUtils.now()
            : new Date().toISOString(),
        };

        if (notes) {
          updatedRequest.notes = notes;
        }

        newData.vrRequests[requestIndex] = updatedRequest;

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'vr_request_updated',
            {
              requestId: requestId,
              newStatus: newStatus,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'VR Request updated but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast(
              `VR Request #${requestId} status updated to ${newStatus}.`,
              'success'
            );
          }
        } else if (showToast && this.toastService) {
          this._showToast(
            `VR Request #${requestId} status updated to ${newStatus}.`,
            'success'
          );
        }

        return {
          success: true,
          vrRequest: updatedRequest,
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
     * Delete a VR request
     * @param {number} requestId - VR request ID
     * @param {Object} fullData - Full nightingale data object
     * @param {Object} options - Options: { saveToFile: boolean, showToast: boolean }
     * @returns {Promise<Object>} Result: { success: boolean, data?: Object, error?: string }
     */
    async deleteVrRequest(requestId, fullData, options = {}) {
      const { saveToFile = true, showToast = true } = options;

      try {
        const existingRequest = this.getVrRequestById(fullData, requestId);
        if (!existingRequest) {
          return {
            success: false,
            error: 'VR Request not found',
          };
        }

        // Create new data object
        const newData = this._
          ? this._.cloneDeep(fullData)
          : JSON.parse(JSON.stringify(fullData));

        // Remove request
        newData.vrRequests = newData.vrRequests.filter(
          (r) => r.id !== requestId
        );

        // Save to file if requested
        if (saveToFile && this.fileService) {
          const success = await this._saveWithSync(
            newData,
            'vr_request_deleted',
            {
              requestId: requestId,
            }
          );

          if (!success) {
            if (showToast && this.toastService) {
              this._showToast(
                'VR Request deleted but failed to save to file.',
                'warning'
              );
            }
          } else if (showToast && this.toastService) {
            this._showToast(
              `VR Request #${requestId} deleted and synced with CMS.`,
              'success'
            );
          }
        } else if (showToast && this.toastService) {
          this._showToast(
            `VR Request #${requestId} deleted successfully.`,
            'success'
          );
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
     * Get all financial items for a case (resources, income, expenses)
     * @param {Object} caseData - Case data object
     * @returns {Array} Array of all financial items with source type
     */
    getCaseFinancialItems(caseData) {
      if (!caseData || !caseData.financials) {
        return [];
      }

      const allItems = [];

      // Add resources
      if (caseData.financials.resources) {
        caseData.financials.resources.forEach((item) => {
          allItems.push({ ...item, sourceType: 'resources' });
        });
      }

      // Add income
      if (caseData.financials.income) {
        caseData.financials.income.forEach((item) => {
          allItems.push({ ...item, sourceType: 'income' });
        });
      }

      // Add expenses
      if (caseData.financials.expenses) {
        caseData.financials.expenses.forEach((item) => {
          allItems.push({ ...item, sourceType: 'expenses' });
        });
      }

      return allItems;
    }

    /**
     * Get financial items by IDs from a case
     * @param {Object} caseData - Case data object
     * @param {Array} itemIds - Array of financial item IDs
     * @returns {Array} Array of financial items matching the IDs
     */
    getFinancialItemsByIds(caseData, itemIds) {
      const allItems = this.getCaseFinancialItems(caseData);
      return itemIds
        .map((id) => allItems.find((item) => item.id === id))
        .filter(Boolean);
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
        // Fallback when no toast service is available
      }
    }

    /**
     * Get VR request statistics
     * @param {Object} data - Full nightingale data object
     * @param {number} caseId - Optional case ID to filter by
     * @returns {Object} Statistics about VR requests
     */
    getVrRequestStats(data, caseId = null) {
      let requests = this.getVrRequests(data);

      if (caseId) {
        requests = requests.filter((r) => r.caseId === caseId);
      }

      const statusCounts = {};
      requests.forEach((request) => {
        statusCounts[request.status] = (statusCounts[request.status] || 0) + 1;
      });

      return {
        total: requests.length,
        byStatus: statusCounts,
        pending: statusCounts['Pending'] || 0,
        approved: statusCounts['Approved'] || 0,
        rejected: statusCounts['Rejected'] || 0,
        completed: statusCounts['Completed'] || 0,
      };
    }
  }

  // Create and export service instance
  const documentGenerationService = new DocumentGenerationService();

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = documentGenerationService;
  } else if (typeof window !== 'undefined') {
    // Browser - register with global namespace
    window.NightingaleDocumentGenerationService = documentGenerationService;

    // Register with component system if available
    if (window.NightingaleServices) {
      window.NightingaleServices.documentGenerationService =
        documentGenerationService;
    }
  }
})();

// ES6 Module Export
export default (typeof window !== 'undefined' &&
  window.NightingaleDocumentGenerationService) ||
  null;
