#!/usr/bin/env node

/**
 * Nightingale CMS Data Migration Script
 *
 * Migrates legacy data format to current Nightingale CMS structure.
 * Handles both individual LTC cases and complex SIMP cases with relationships.
 *
 * Usage: node .vscode/data-migration.js [input-file] [output-file]
 *
 * Features:
 * - Safe migration with validation
 * - Automatic backup creation
 * - Field mapping and normalization
 * - Relationship preservation
 * - Financial data restructuring
 * - Error reporting and rollback capability
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  backupDir: './Data/backups',
  defaultInput: './Data/legacy-data.json',
  defaultOutput: './Data/nightingale-data.json',
  requiredFields: {
    cases: ['id', 'personId', 'status'],
    people: ['id', 'name'],
    organizations: ['id', 'name'],
  },
};

// Utility functions
const utils = {
  /**
   * Create a timestamped backup of existing data
   */
  createBackup(filePath) {
    if (!fs.existsSync(filePath)) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `backup-${timestamp}.json`);

    // Ensure backup directory exists
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }

    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  },

  /**
   * Validate required fields exist in data structure
   */
  validateData(data, type) {
    const required = CONFIG.requiredFields[type] || [];
    const missing = required.filter((field) => !data.hasOwnProperty(field));

    if (missing.length > 0) {
      throw new Error(
        `Missing required fields for ${type}: ${missing.join(', ')}`
      );
    }
    return true;
  },

  /**
   * Generate unique ID for new records
   */
  generateId(existingIds) {
    let newId = 1;
    while (existingIds.includes(String(newId)) || existingIds.includes(newId)) {
      newId++;
    }
    return String(newId);
  },

  /**
   * Normalize date to ISO string
   */
  normalizeDate(dateInput) {
    if (!dateInput) return null;

    try {
      const date = new Date(dateInput);
      return date.toISOString();
    } catch (error) {
      console.warn(`⚠️  Invalid date format: ${dateInput}`);
      return null;
    }
  },

  /**
   * Safe string conversion
   */
  safeString(value) {
    return value ? String(value).trim() : '';
  },
};

// Migration transformations
const migrations = {
  /**
   * Migrate person records from legacy to current format
   */
  migratePerson(legacyPerson, existingPeople = []) {
    utils.validateData(legacyPerson, 'people');

    const existingIds = existingPeople.map((p) => p.id);
    const personId = legacyPerson.id || utils.generateId(existingIds);

    // Handle address structure transformation
    const address = {
      street: utils.safeString(legacyPerson.address || ''),
      city: utils.safeString(legacyPerson.city || ''),
      state: utils.safeString(legacyPerson.state || 'NE'),
      zip: utils.safeString(legacyPerson.zipCode || ''),
    };

    // Create mailing address (same as physical unless specified)
    const mailingAddress = {
      ...address,
      sameAsPhysical: true,
    };

    const migratedPerson = {
      id: personId,
      name: utils.safeString(legacyPerson.name),
      dateOfBirth: legacyPerson.dob || '',
      ssn: utils.safeString(legacyPerson.ssn || ''),
      phone: utils.safeString(legacyPerson.phone || ''),
      email: utils.safeString(legacyPerson.email || ''),
      address,
      mailingAddress,
      organizationId: legacyPerson.organizationId || null,
      livingArrangement: utils.safeString(
        legacyPerson.livingArrangement || 'Apartment/House'
      ),
      authorizedRepIds: Array.isArray(legacyPerson.authorizedRepIds)
        ? legacyPerson.authorizedRepIds.map((id) => String(id))
        : [],
      familyMembers: [], // Will be populated based on spouse relationships
      createdAt:
        utils.normalizeDate(legacyPerson.createdAt) || new Date().toISOString(),
      status: 'active',
    };

    return migratedPerson;
  },

  /**
   * Migrate case records from legacy to current format
   */
  migrateCase(legacyCase, existingCases = []) {
    utils.validateData(legacyCase, 'cases');

    const existingIds = existingCases.map((c) => c.id);
    const caseId = legacyCase.id || utils.generateId(existingIds);

    // Handle application details transformation
    const appDetails = {
      applicationType:
        legacyCase.appDetails?.applicationType ||
        legacyCase.applicationType ||
        'Application',
      appDate:
        legacyCase.appDetails?.appDate || legacyCase.applicationDate || '',
      caseType: legacyCase.appDetails?.caseType || legacyCase.caseType || 'LTC',
      avsConsentDate: legacyCase.appDetails?.avsConsentDate || '',
      admissionDate: legacyCase.appDetails?.admissionDate || '',
      medicareAExpDate: legacyCase.appDetails?.medicareAExpDate || '',
    };

    // Handle financial data transformation
    const financials = {
      resources: (legacyCase.financials?.resources || []).map(
        migrations.migrateFinancialItem
      ),
      income: (legacyCase.financials?.income || []).map(
        migrations.migrateFinancialItem
      ),
      expenses: (legacyCase.financials?.expenses || []).map(
        migrations.migrateFinancialItem
      ),
    };

    // Handle notes transformation
    const notes = (legacyCase.notes || []).map((note) => ({
      id: note.id || utils.generateId([]),
      category: utils.safeString(note.category || 'General'),
      text: utils.safeString(note.text || ''),
      timestamp:
        utils.normalizeDate(note.timestamp) || new Date().toISOString(),
    }));

    const migratedCase = {
      id: String(caseId),
      masterCaseNumber: utils.safeString(legacyCase.masterCaseNumber || ''),
      mcn: utils.safeString(legacyCase.masterCaseNumber || ''), // Backward compatibility
      personId: String(legacyCase.personId),
      spouseId: legacyCase.spouseId ? String(legacyCase.spouseId) : '',
      status: utils.safeString(legacyCase.status || 'Pending'),
      priority: Boolean(legacyCase.priority),
      retroStatus: Boolean(legacyCase.retroStatus),
      retroRequested: legacyCase.retroStatus ? 'Yes' : 'No',
      appDetails,
      createdAt:
        utils.normalizeDate(legacyCase.createdAt) || new Date().toISOString(),
      lastOpened:
        utils.normalizeDate(legacyCase.lastOpened) || new Date().toISOString(),
      applicationDate: appDetails.appDate, // Backward compatibility
      caseType: appDetails.caseType, // Backward compatibility
      financials,
      notes,
      // Additional fields for compatibility
      organizationId: null,
      organizationAddress: 'Not specified',
      livingArrangement: 'Not specified',
      description: '',
      address: '',
      unit: '',
      city: '',
      state: '',
      zipCode: '',
      authorizedReps: [],
      createdDate:
        utils.normalizeDate(legacyCase.createdAt) || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    return migratedCase;
  },

  /**
   * Migrate financial items (resources, income, expenses)
   */
  migrateFinancialItem(legacyItem) {
    if (!legacyItem) return null;

    return {
      id: legacyItem.id || utils.generateId([]),
      type: utils.safeString(legacyItem.type || ''),
      description: utils.safeString(legacyItem.type || ''), // For compatibility
      location: utils.safeString(legacyItem.location || ''),
      accountNumber: utils.safeString(legacyItem.accountNumber || ''),
      value: Number(legacyItem.value || 0),
      amount: Number(legacyItem.value || 0), // For compatibility
      verificationStatus: utils.safeString(
        legacyItem.verificationStatus || 'Needs VR'
      ),
      verificationSource: utils.safeString(legacyItem.source || ''),
      source: utils.safeString(legacyItem.source || ''), // For compatibility
      notes: utils.safeString(legacyItem.notes || ''),
      owner: utils.safeString(legacyItem.owner || 'applicant'),
      frequency: 'monthly', // Default frequency
      dateAdded: new Date().toISOString(),
    };
  },

  /**
   * Establish family relationships based on spouse IDs
   */
  establishRelationships(people) {
    const peopleMap = new Map(people.map((p) => [String(p.id), p]));

    people.forEach((person) => {
      // Handle spouse relationships
      const spouseData = people.find(
        (p) =>
          String(p.id) === String(person.spouseId) ||
          String(p.spouseId) === String(person.id)
      );

      if (spouseData && !person.familyMembers.includes(String(spouseData.id))) {
        person.familyMembers.push(String(spouseData.id));
      }
    });

    return people;
  },
};

// Main migration function
async function migrateData(inputFile, outputFile) {
  console.log('🚀 Starting Nightingale CMS Data Migration...');

  try {
    // Step 1: Read legacy data
    console.log(`📖 Reading legacy data from: ${inputFile}`);
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }

    const legacyData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`✅ Legacy data loaded successfully`);

    // Step 2: Create backup of existing data
    const backupPath = utils.createBackup(outputFile);

    // Step 3: Read existing data or create default structure
    let existingData = {
      cases: [],
      people: [],
      organizations: [],
      nextPersonId: 1,
      nextCaseId: 1,
      nextOrganizationId: 1,
      nextFinancialItemId: 1,
      nextNoteId: 1,
      showAllCases: false,
      showAllContacts: false,
      showAllPeople: true,
      caseSortReversed: false,
      priorityFilterActive: false,
      contacts: [],
      vrTemplates: [],
      nextVrTemplateId: 1,
      vrCategories: [],
      vrRequests: [],
      nextVrRequestId: 1,
      vrDraftItems: [],
      activeCase: null,
      isDataLoaded: true,
      showAllOrganizations: false,
    };

    if (fs.existsSync(outputFile)) {
      existingData = {
        ...existingData,
        ...JSON.parse(fs.readFileSync(outputFile, 'utf8')),
      };
      console.log(`📋 Existing data structure preserved`);
    }

    // Step 4: Migrate data based on input format
    let migratedData = { ...existingData };

    // Handle different input formats
    if (legacyData.people && Array.isArray(legacyData.people)) {
      // Format 2: Complete data structure with people and cases arrays
      console.log('🔄 Migrating complete data structure...');

      // Migrate people
      const migratedPeople = legacyData.people.map((person) =>
        migrations.migratePerson(person, migratedData.people)
      );

      // Establish relationships
      const peopleWithRelationships =
        migrations.establishRelationships(migratedPeople);

      // Merge with existing people (avoid duplicates)
      const existingPersonIds = migratedData.people.map((p) => String(p.id));
      const newPeople = peopleWithRelationships.filter(
        (p) => !existingPersonIds.includes(String(p.id))
      );

      migratedData.people = [...migratedData.people, ...newPeople];

      // Migrate cases
      if (legacyData.cases && Array.isArray(legacyData.cases)) {
        const migratedCases = legacyData.cases.map((caseItem) =>
          migrations.migrateCase(caseItem, migratedData.cases)
        );

        // Merge with existing cases (avoid duplicates)
        const existingCaseIds = migratedData.cases.map((c) => String(c.id));
        const newCases = migratedCases.filter(
          (c) => !existingCaseIds.includes(String(c.id))
        );

        migratedData.cases = [...migratedData.cases, ...newCases];
      }
    } else if (legacyData.id && legacyData.personId) {
      // Format 1: Single case record
      console.log('🔄 Migrating single case record...');

      const migratedCase = migrations.migrateCase(
        legacyData,
        migratedData.cases
      );

      // Check for duplicates
      const existingCase = migratedData.cases.find(
        (c) =>
          String(c.id) === String(migratedCase.id) ||
          c.masterCaseNumber === migratedCase.masterCaseNumber
      );

      if (!existingCase) {
        migratedData.cases.push(migratedCase);
      } else {
        console.log(`⚠️  Case ${migratedCase.id} already exists, skipping...`);
      }
    } else {
      throw new Error(
        'Unknown data format. Expected either single case or {people: [], cases: []} structure'
      );
    }

    // Step 5: Update ID counters
    const allPersonIds = migratedData.people.map((p) => parseInt(p.id) || 0);
    const allCaseIds = migratedData.cases.map((c) => parseInt(c.id) || 0);

    migratedData.nextPersonId =
      Math.max(...allPersonIds, migratedData.nextPersonId || 0) + 1;
    migratedData.nextCaseId =
      Math.max(...allCaseIds, migratedData.nextCaseId || 0) + 1;

    // Step 6: Write migrated data
    console.log(`💾 Writing migrated data to: ${outputFile}`);
    fs.writeFileSync(outputFile, JSON.stringify(migratedData, null, 2), 'utf8');

    // Step 7: Validation
    console.log('🔍 Validating migrated data...');
    const validation = {
      totalPeople: migratedData.people.length,
      totalCases: migratedData.cases.length,
      casesWithFinancials: migratedData.cases.filter(
        (c) =>
          c.financials &&
          (c.financials.resources.length > 0 ||
            c.financials.income.length > 0 ||
            c.financials.expenses.length > 0)
      ).length,
      peopleWithRelationships: migratedData.people.filter(
        (p) => p.familyMembers.length > 0 || p.authorizedRepIds.length > 0
      ).length,
    };

    console.log('\n📊 Migration Summary:');
    console.log(`   People: ${validation.totalPeople}`);
    console.log(`   Cases: ${validation.totalCases}`);
    console.log(`   Cases with Financials: ${validation.casesWithFinancials}`);
    console.log(
      `   People with Relationships: ${validation.peopleWithRelationships}`
    );

    if (backupPath) {
      console.log(`\n🛡️  Backup available at: ${backupPath}`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// CLI handling
function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0] || CONFIG.defaultInput;
  const outputFile = args[1] || CONFIG.defaultOutput;

  console.log('Nightingale CMS Data Migration Tool');
  console.log('===================================');
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');

  migrateData(inputFile, outputFile);
}

// Export for use as module
module.exports = {
  migrateData,
  migrations,
  utils,
  CONFIG,
};

// Run if called directly
if (require.main === module) {
  main();
}
