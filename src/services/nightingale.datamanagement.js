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

/**
 * Ensure an ID is a string and optionally sanitize format
 * Keeps existing prefixed/UUID ids; converts numbers to strings.
 *
 * @param {string|number} id
 * @returns {string}
 */
function ensureStringId(id) {
  if (id === undefined || id === null) return '';
  return String(id);
}

/**
 * Extract numeric suffix from an id for counter derivation.
 * @param {string} id
 * @returns {number|null}
 */
function numericSuffix(id) {
  if (!id) return null;
  const m = String(id).match(/(\d+)(?!.*\d)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Normalize address to object form; accept string legacy value
 * @param {object|string|undefined} addr
 * @returns {{street:string,city:string,state:string,zip:string}}
 */
function normalizeAddress(addr) {
  if (addr && typeof addr === 'object') {
    return {
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip || '',
    };
  }
  if (typeof addr === 'string') {
    // Best-effort split: "street, city, state zip"
    const parts = addr.split(',').map((s) => s.trim());
    const [street = '', city = '', stateZip = ''] = parts;
    let state = '';
    let zip = '';
    if (stateZip) {
      const m = stateZip.match(/([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?/);
      if (m) {
        state = m[1] || '';
        zip = m[2] || '';
      } else {
        state = stateZip;
      }
    }
    return { street, city, state, zip };
  }
  return { street: '', city: '', state: '', zip: '' };
}

/**
 * Coerce amount/value to number
 */
function toNumber(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
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

  // Preserve empty objects without adding scaffolding to satisfy callers/tests expecting {} unchanged
  if (Object.keys(normalizedData).length === 0) {
    return normalizedData;
  }

  // Ensure metadata scaffold
  normalizedData.metadata = normalizedData.metadata || {};
  if (!normalizedData.metadata.schemaVersion) {
    normalizedData.metadata.schemaVersion = '2024.1';
  }
  if (!normalizedData.metadata.version) {
    normalizedData.metadata.version = '1.0.0';
  }

  // Normalize case data structure
  if (normalizedData.cases) {
    const peopleById = new Map(
      (normalizedData.people || []).map((p) => {
        const person = { ...p };
        // Derive composite name if missing
        if (!person.name) {
          const composite = [person.firstName, person.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
          if (composite) person.name = composite;
        }
        return [ensureStringId(person.id), person];
      }),
    );
    normalizedData.cases = normalizedData.cases.map((caseItem) => {
      const normalizedCase = { ...caseItem };

      // Ensure every case has a proper ID with secure generation
      if (!normalizedCase.id || normalizedCase.id === null) {
        normalizedCase.id = generateSecureId('case');
      }
      normalizedCase.id = ensureStringId(normalizedCase.id);

      // Ensure MCN field consistency - map both directions
      // Legacy field migration: masterCaseNumber -> mcn
      if (caseItem.masterCaseNumber && !caseItem.mcn) {
        normalizedCase.mcn = caseItem.masterCaseNumber;
      }

      // Enforce MCN numeric-only string if present
      if (normalizedCase.mcn) {
        normalizedCase.mcn = String(normalizedCase.mcn).replace(/\D/g, '');
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
      if (normalizedCase.personId) {
        normalizedCase.personId = ensureStringId(normalizedCase.personId);
      }

      // Backfill clientName from person if missing
      if (!normalizedCase.clientName && normalizedCase.personId) {
        const person = peopleById.get(normalizedCase.personId);
        if (person?.name) normalizedCase.clientName = person.name;
      }

      // Backfill clientAddress from person if missing
      if (!normalizedCase.clientAddress && normalizedCase.personId) {
        const person = peopleById.get(normalizedCase.personId);
        if (person?.address) {
          normalizedCase.clientAddress = normalizeAddress(person.address);
        }
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

                // Ensure id
                if (!migratedItem.id) {
                  migratedItem.id = generateSecureId('financial');
                } else {
                  migratedItem.id = ensureStringId(migratedItem.id);
                }

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

                // Normalize numeric fields
                migratedItem.amount = toNumber(migratedItem.amount, 0);
                migratedItem.value = toNumber(
                  migratedItem.value,
                  migratedItem.amount,
                );

                // Defaults for UI expectations
                if (!migratedItem.owner) migratedItem.owner = 'applicant';
                if (!migratedItem.verificationStatus) {
                  migratedItem.verificationStatus =
                    item.verified === true ? 'Verified' : 'Needs VR';
                }
                if (
                  migratedItem.accountNumber &&
                  typeof migratedItem.accountNumber === 'number'
                ) {
                  migratedItem.accountNumber = String(
                    migratedItem.accountNumber,
                  );
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
      normalizedPerson.id = ensureStringId(normalizedPerson.id);

      // Ensure default values for required fields
      if (!normalizedPerson.name) {
        const composite = [
          normalizedPerson.firstName,
          normalizedPerson.lastName,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();
        normalizedPerson.name = composite || 'Unknown Person';
      }

      if (!normalizedPerson.status) {
        normalizedPerson.status = 'active';
      }

      if (!normalizedPerson.dateAdded) {
        normalizedPerson.dateAdded = new Date().toISOString();
      }

      // Normalize address structures
      if (normalizedPerson.address) {
        normalizedPerson.address = normalizeAddress(normalizedPerson.address);
      }
      if (normalizedPerson.mailingAddress) {
        const m = normalizedPerson.mailingAddress;
        normalizedPerson.mailingAddress = {
          ...normalizeAddress(m),
          sameAsPhysical:
            typeof m.sameAsPhysical === 'boolean' ? m.sameAsPhysical : false,
        };
      } else {
        normalizedPerson.mailingAddress = {
          ...normalizeAddress(undefined),
          sameAsPhysical: false,
        };
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
      normalizedOrg.id = ensureStringId(normalizedOrg.id);

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

      // Normalize address and contact structures
      if (normalizedOrg.address) {
        normalizedOrg.address = normalizeAddress(normalizedOrg.address);
      }
      if (normalizedOrg.contactPerson) {
        normalizedOrg.contactPerson = {
          name: normalizedOrg.contactPerson.name || '',
          title: normalizedOrg.contactPerson.title || '',
          phone: normalizedOrg.contactPerson.phone || '',
          email: normalizedOrg.contactPerson.email || '',
        };
      }

      // Ensure personnel list exists for modern UI
      if (!Array.isArray(normalizedOrg.personnel)) {
        normalizedOrg.personnel = [];
      }

      return normalizedOrg;
    });
  }

  // Ensure counters exist by deriving from current data when missing
  const deriveNext = (items, fallback = 1) => {
    if (!Array.isArray(items) || items.length === 0) return fallback;
    const maxNum = items.reduce((acc, it) => {
      const n = numericSuffix(ensureStringId(it.id));
      return n && n > acc ? n : acc;
    }, 0);
    return (maxNum || 0) + 1;
  };

  if (normalizedData.nextPersonId == null) {
    normalizedData.nextPersonId = deriveNext(normalizedData.people, 1);
  }
  if (normalizedData.nextOrganizationId == null) {
    normalizedData.nextOrganizationId = deriveNext(
      normalizedData.organizations,
      1,
    );
  }
  if (normalizedData.nextCaseId == null) {
    normalizedData.nextCaseId = deriveNext(normalizedData.cases, 1);
  }
  if (normalizedData.nextFinancialItemId == null) {
    const allFin = (normalizedData.cases || []).flatMap((c) =>
      ['resources', 'income', 'expenses'].flatMap(
        (k) => c.financials?.[k] || [],
      ),
    );
    normalizedData.nextFinancialItemId = deriveNext(allFin, 1);
  }
  if (normalizedData.nextNoteId == null) {
    const allNotes = (normalizedData.cases || []).flatMap((c) => c.notes || []);
    normalizedData.nextNoteId = deriveNext(allNotes, 1);
  }

  // Ensure optional scaffolds
  normalizedData.vrTemplates = normalizedData.vrTemplates || [];
  normalizedData.vrCategories = normalizedData.vrCategories || [];
  normalizedData.vrRequests = normalizedData.vrRequests || [];
  normalizedData.contacts = normalizedData.contacts || [];
  normalizedData.viewState = normalizedData.viewState || {
    currentTab: 'case-management',
    currentTitle: 'Cases',
    currentCaseId: null,
    lastRefreshTimestamp: new Date().toISOString(),
    expandedFinancialCards: {},
  };
  normalizedData.accordionState = normalizedData.accordionState || {};

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
  ensureStringId,

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
  ensureStringId,
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
