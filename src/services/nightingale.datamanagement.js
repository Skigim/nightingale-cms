/**
 * Nightingale Data Management Service
 *
 * Provides comprehensive data management, transformation, and validation functions
 * for the Nightingale CMS. This service handles:
 * - Data migration and normalization
 * - Collection update operations
 * - Financial item transformations
 * - Data validation
 * - Legacy data compatibility
 *
 * @namespace NightingaleDataManagement
 * @version 1.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

(function (window) {
  'use strict';

  // ========================================================================
  // DATA LOOKUP AND SEARCH FUNCTIONS
  // ========================================================================

  /**
   * Helper function to find person by ID with flexible matching
   * Handles legacy ID formats and zero-padding compatibility
   *
   * @param {Array} people - Array of person objects
   * @param {string|number} personId - Person ID to search for
   * @returns {Object|null} Found person object or null
   */
  function findPersonById(people, personId) {
    if (!people || !personId) return null;

    return people.find((p) => {
      // Convert both to strings and try exact match
      if (String(p.id) === String(personId)) return true;
      // Try with zero-padding (legacy format)
      if (String(p.id) === String(personId).padStart(2, '0')) return true;
      // Try reverse: personId might be zero-padded
      if (String(p.id).padStart(2, '0') === String(personId)) return true;
      // Try numeric comparison
      if (Number(p.id) === Number(personId)) return true;
      return false;
    });
  }

  // ========================================================================
  // DATA MIGRATION AND NORMALIZATION FUNCTIONS
  // ========================================================================

  /**
   * Comprehensive data migration and normalization for CMS React compatibility
   * Handles legacy data formats and ensures consistency across the application
   *
   * @param {Object} data - Raw data object to normalize
   * @returns {Promise<Object>} Normalized data object
   */
  async function normalizeDataMigrations(data) {
    if (!data) return data;

    console.debug('🔄 Running data migrations for CMS React compatibility...');

    // Normalize case data structure
    if (data.cases) {
      data.cases = data.cases.map((caseItem) => {
        const normalizedCase = { ...caseItem };

        // Ensure MCN field consistency - map both directions
        // Legacy field migration: masterCaseNumber -> mcn
        if (caseItem.masterCaseNumber && !caseItem.mcn) {
          normalizedCase.mcn = caseItem.masterCaseNumber;
        }

        // Map appDetails.appDate to applicationDate
        if (caseItem.appDetails?.appDate && !caseItem.applicationDate) {
          normalizedCase.applicationDate = caseItem.appDetails.appDate;
        }

        // Map appDetails.caseType to caseType if missing
        if (caseItem.appDetails?.caseType && !caseItem.caseType) {
          normalizedCase.caseType = caseItem.appDetails.caseType;
        }

        // Add default values for new fields if they don't exist
        if (!normalizedCase.livingArrangement) {
          normalizedCase.livingArrangement = 'Not specified';
        }

        if (!normalizedCase.organizationAddress) {
          normalizedCase.organizationAddress = 'Not specified';
        }

        // FINANCIAL ITEMS MIGRATION: type → description, value → amount
        if (normalizedCase.financials) {
          ['resources', 'income', 'expenses'].forEach((financialType) => {
            if (normalizedCase.financials[financialType]) {
              normalizedCase.financials[financialType] =
                normalizedCase.financials[financialType].map((item) => {
                  const migratedItem = { ...item };

                  // Migrate type → description (CMSOld uses "type", React uses "description")
                  if (item.type && !item.description) {
                    migratedItem.description = item.type;
                    console.log(
                      `🏷️ Migrated financial item type "${item.type}" → description`
                    );
                  }

                  // Migrate value → amount (CMSOld uses "value", React uses "amount")
                  if (item.value !== undefined && item.amount === undefined) {
                    migratedItem.amount = item.value;
                    console.log(
                      `💰 Migrated financial item value ${item.value} → amount`
                    );
                  }

                  // Ensure backward compatibility: keep both fields
                  if (item.description && !item.type) {
                    migratedItem.type = item.description;
                  }
                  if (item.amount !== undefined && item.value === undefined) {
                    migratedItem.value = item.amount;
                  }

                  // Add missing fields with defaults
                  if (!migratedItem.frequency) {
                    migratedItem.frequency = 'monthly'; // Default frequency for new React model
                  }

                  if (!migratedItem.dateAdded) {
                    migratedItem.dateAdded = new Date().toISOString();
                  }

                  // Ensure verificationSource instead of just source
                  if (item.source && !item.verificationSource) {
                    migratedItem.verificationSource = item.source;
                  }

                  return migratedItem;
                });
            }
          });
        }

        return normalizedCase;
      });
    }

    // Normalize people data structure
    if (data.people) {
      data.people = data.people.map((person, index) => {
        const normalizedPerson = { ...person };

        // Ensure every person has an ID
        if (!normalizedPerson.id) {
          normalizedPerson.id = `person-${Date.now()}-${index}`;
        }

        // Ensure default values for required fields
        if (!normalizedPerson.name) {
          normalizedPerson.name = 'Unknown Person';
        }

        if (!normalizedPerson.status) {
          normalizedPerson.status = 'active';
        }

        if (!normalizedPerson.dateAdded) {
          normalizedPerson.dateAdded = new Date().toISOString();
        }

        return normalizedPerson;
      });
    }

    // Normalize organizations data structure
    if (data.organizations) {
      data.organizations = data.organizations.map((org, index) => {
        const normalizedOrg = { ...org };

        // Ensure every organization has an ID
        if (!normalizedOrg.id) {
          normalizedOrg.id = `org-${Date.now()}-${index}`;
        }

        // Ensure default values for required fields
        if (!normalizedOrg.name) {
          normalizedOrg.name = 'Unknown Organization';
        }

        if (!normalizedOrg.status) {
          normalizedOrg.status = 'active';
        }

        if (!normalizedOrg.dateAdded) {
          normalizedOrg.dateAdded = new Date().toISOString();
        }

        return normalizedOrg;
      });
    }

    console.debug('✅ Data migration completed successfully');
    return data;
  }

  // ========================================================================
  // DATA COLLECTION UPDATE HELPER FUNCTIONS
  // ========================================================================

  /**
   * Update a specific case in a collection
   * @param {Array} cases - Array of case objects
   * @param {string} caseId - ID of case to update
   * @param {Object} updatedCase - Updated case object
   * @returns {Array} Updated cases array
   */
  function updateCaseInCollection(cases, caseId, updatedCase) {
    return cases.map((c) => (c.id === caseId ? updatedCase : c));
  }

  /**
   * Update a specific person in a collection
   * @param {Array} people - Array of person objects
   * @param {string} personId - ID of person to update
   * @param {Object} updatedPerson - Updated person object
   * @returns {Array} Updated people array
   */
  function updatePersonInCollection(people, personId, updatedPerson) {
    return people.map((p) => (p.id === personId ? updatedPerson : p));
  }

  /**
   * Update a specific organization in a collection
   * @param {Array} organizations - Array of organization objects
   * @param {string} orgId - ID of organization to update
   * @param {Object} updatedOrg - Updated organization object
   * @returns {Array} Updated organizations array
   */
  function updateOrganizationInCollection(organizations, orgId, updatedOrg) {
    return organizations.map((o) => (o.id === orgId ? updatedOrg : o));
  }

  // ========================================================================
  // FINANCIAL ITEM TRANSFORMATION FUNCTIONS
  // ========================================================================

  /**
   * Transform imported financial items to Nightingale CMS format
   * Handles AVS imports and legacy data structures
   *
   * @param {Array} importedItems - Raw financial items to transform
   * @returns {Array} Transformed financial items
   */
  function transformFinancialItems(importedItems) {
    return importedItems.map((item) => ({
      id: `financial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description:
        item.description ||
        `${item.type} - ${item.location}` ||
        item.type ||
        'Unknown Item',
      location: item.location || '',
      accountNumber: item.accountNumber || '',
      amount: item.amount || item.value || 0,
      type: item.type || '', // Keep legacy field for AVS compatibility
      frequency: item.frequency || 'monthly',
      owner: item.owner || 'applicant',
      verificationStatus: item.verificationStatus || 'Verified',
      verificationSource:
        item.verificationSource || item.source || 'AVS Import',
      source: item.source || 'AVS Import', // Keep legacy field
      notes:
        item.notes ||
        `Imported from AVS${item.isDuplicate ? ' (Potential Duplicate)' : ''}`,
      dateAdded: item.dateAdded || new Date().toISOString(),
    }));
  }

  // ========================================================================
  // DATA VALIDATION FUNCTIONS
  // ========================================================================

  /**
   * Validate case data before saving
   * @param {Object} caseData - Case data to validate
   * @returns {Object} Validation errors object
   */
  function validateCaseData(caseData) {
    const errors = {};

    if (!caseData.mcn) {
      errors.mcn = 'MCN is required';
    }

    if (!caseData.personId) {
      errors.personId = 'Person selection is required';
    }

    return errors;
  }

  /**
   * Validate person data before saving
   * @param {Object} personData - Person data to validate
   * @returns {Object} Validation errors object
   */
  function validatePersonData(personData) {
    const errors = {};

    if (!personData.name || personData.name.trim() === '') {
      errors.name = 'Name is required';
    }

    return errors;
  }

  /**
   * Validate organization data before saving
   * @param {Object} orgData - Organization data to validate
   * @returns {Object} Validation errors object
   */
  function validateOrganizationData(orgData) {
    const errors = {};

    if (!orgData.name || orgData.name.trim() === '') {
      errors.name = 'Organization name is required';
    }

    return errors;
  }

  // ========================================================================
  // SERVICE INITIALIZATION AND EXPORT
  // ========================================================================

  // Create service object
  const NightingaleDataManagement = {
    // Data lookup functions
    findPersonById,

    // Migration functions
    normalizeDataMigrations,

    // Collection update functions
    updateCaseInCollection,
    updatePersonInCollection,
    updateOrganizationInCollection,

    // Transformation functions
    transformFinancialItems,

    // Validation functions
    validateCaseData,
    validatePersonData,
    validateOrganizationData,

    // Metadata
    version: '1.0.0',
    name: 'NightingaleDataManagement',
  };

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.NightingaleDataManagement = NightingaleDataManagement;
    console.info('✅ Nightingale Data Management Service loaded');

    // Register with service registry if available
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      window.NightingaleServices.registerService(
        'dataManagement',
        NightingaleDataManagement
      );
      console.log(
        '📋 Data Management Service registered with Nightingale Services'
      );
    }
  }

  // Return service for module systems
  return NightingaleDataManagement;
})(typeof window !== 'undefined' ? window : this);
