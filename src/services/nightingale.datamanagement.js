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
 * @version 1.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

/**
 * Generate secure unique IDs using crypto.randomUUID when available
 * Falls back to timestamp + crypto random for older browsers
 *
 * @param {string} prefix - Prefix for the ID (e.g., 'person', 'org', 'case')
 * @returns {string} Secure unique ID
 */
function generateSecureId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  // Fallback for older browsers using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(3);
    crypto.getRandomValues(array);
    const timestamp = Date.now().toString(36);
    const randomPart = Array.from(array, (x) => x.toString(36)).join('');
    return `${prefix}-${timestamp}-${randomPart}`;
  }

  // Final fallback (should rarely be used in modern browsers)
  // This fallback is for environments where crypto is not available.
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${randomPart}`;
}

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
    // Create a deep clone to prevent race conditions during concurrent modifications
    const normalizedData = JSON.parse(JSON.stringify(data));

    // Normalize case data structure
    if (normalizedData.cases) {
      normalizedData.cases = normalizedData.cases.map((caseItem) => {
        const normalizedCase = { ...caseItem };

        // Ensure every case has a proper ID with secure generation
        if (!normalizedCase.id || normalizedCase.id === null) {
          normalizedCase.id = generateSecureId('case');
        }

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

        // Convert legacy createdAt to createdDate
        if (caseItem.createdAt && !caseItem.createdDate) {
          normalizedCase.createdDate = caseItem.createdAt;
        }

        // Ensure personId is a string (legacy uses numbers)
        if (
          normalizedCase.personId &&
          typeof normalizedCase.personId === 'number'
        ) {
          normalizedCase.personId = normalizedCase.personId.toString();
        }

        // Add required fields with defaults for legacy cases
        if (!normalizedCase.status) {
          normalizedCase.status = 'Pending';
        }

        if (!normalizedCase.description) {
          normalizedCase.description = '';
        }

        if (!normalizedCase.priority) {
          normalizedCase.priority = false;
        }

        if (!normalizedCase.withWaiver) {
          normalizedCase.withWaiver = false;
        }

        if (!normalizedCase.authorizedReps) {
          normalizedCase.authorizedReps = [];
        }

        if (!normalizedCase.retroRequested) {
          normalizedCase.retroRequested = 'No';
        }

        // Add default values for new fields if they don't exist
        if (!normalizedCase.livingArrangement) {
          normalizedCase.livingArrangement = 'Not specified';
        }

        if (!normalizedCase.organizationAddress) {
          normalizedCase.organizationAddress = 'Not specified';
        }

        // Ensure financials structure exists
        if (!normalizedCase.financials) {
          normalizedCase.financials = {
            resources: [],
            income: [],
            expenses: [],
          };
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
                  }

                  // Migrate value → amount (CMSOld uses "value", React uses "amount")
                  if (item.value !== undefined && item.amount === undefined) {
                    migratedItem.amount = item.value;
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
    if (normalizedData.people) {
      normalizedData.people = normalizedData.people.map((person) => {
        const normalizedPerson = { ...person };

        // Ensure every person has an ID with secure generation
        if (!normalizedPerson.id) {
          normalizedPerson.id = generateSecureId('person');
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

      // Resolve duplicate person IDs
      const seenPersonIds = new Set();
      normalizedData.people = normalizedData.people.map((person) => {
        if (seenPersonIds.has(person.id)) {
          person.id = generateSecureId('person');
        }
        seenPersonIds.add(person.id);
        return person;
      });
    }

    // Normalize organizations data structure
    if (normalizedData.organizations) {
      normalizedData.organizations = normalizedData.organizations.map((org) => {
        const normalizedOrg = { ...org };

        // Ensure every organization has an ID with secure generation
        if (!normalizedOrg.id) {
          normalizedOrg.id = generateSecureId('org');
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

    return normalizedData;
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
    return importedItems.map((item) => {
      // Build description with fallback logic
      let description = item.description;
      if (!description && item.type && item.location) {
        description = `${item.type} - ${item.location}`;
      } else if (!description && item.type) {
        description = item.type;
      } else if (!description) {
        description = 'Unknown Item';
      }

      return {
        id: generateSecureId('financial'),
        description,
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
      };
    });
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

    if (!caseData) {
      errors.mcn = 'MCN is required';
      errors.personId = 'Person selection is required';
      return errors;
    }

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

    if (!personData) {
      errors.name = 'Name is required';
      return errors;
    }

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

    if (!orgData) {
      errors.name = 'Organization name is required';
      return errors;
    }

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
  // Utility functions
  generateSecureId,

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

// Export individual functions for tree-shaking
export {
  generateSecureId,
  findPersonById,
  normalizeDataMigrations,
  updateCaseInCollection,
  updatePersonInCollection,
  updateOrganizationInCollection,
  transformFinancialItems,
  validateCaseData,
  validatePersonData,
  validateOrganizationData,
};

// Default export for backward compatibility
export default NightingaleDataManagement;

// Maintain backward compatibility with global window access
if (typeof window !== 'undefined') {
  window.NightingaleDataManagement = NightingaleDataManagement;
  
  // Register with service registry if available
  if (window.NightingaleServices?.registerService) {
    window.NightingaleServices.registerService('dataManagement', NightingaleDataManagement);
  }
}
