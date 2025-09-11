/**
 * Nightingale CMS Business Utilities Service
 *
 * Provides utility functions specific to CMS business operations and workflows.
 * Handles domain-specific logic for financial data, case management, and application processing.
 *
 * Features:
 * - Financial data flattening and aggregation
 * - Application date label management
 * - Default application details creation
 * - Note category extraction and organization
 * - Case summary generation
 * - VR application integration
 * - Financial data migration utilities
 *
 * @version 2.0.0
 * @author Nightingale CMS Team
 */

/**
 * CMS Business Utilities Service
 */
class NightingaleCMSUtilities {
  constructor() {
    this.version = '2.0.0';
    this.name = 'NightingaleCMSUtilities';
  }

  /**
   * Flattens all financial items (resources, income, expenses) from a case object
   * into a single array.
   * @param {Object} caseObject The case object containing the financials property.
   * @returns {Object[]} A single array containing all financial items.
   */
  getFlatFinancials(caseObject) {
    if (!caseObject || !caseObject.financials) return [];
    return [
      ...(caseObject.financials.resources || []),
      ...(caseObject.financials.income || []),
      ...(caseObject.financials.expenses || []),
    ];
  }

  /**
   * Determines the correct label for the application date field based on the application type.
   * @param {string} applicationType The type of application (e.g., "Application" or "Renewal").
   * @returns {string} The appropriate label.
   */
  getAppDateLabel(applicationType) {
    return applicationType === 'Renewal' ? 'Renewal Due' : 'Application Date';
  }

  /**
   * Returns a new, default object for application details.
   * @returns {Object} The default appDetails object.
   */
  getDefaultAppDetails() {
    return {
      appDate: '',
      applicationType: 'Application',
      povertyGuidelines: '',
      householdSize: '',
      totalIncome: '',
      annualIncome: '',
      monthlyIncome: '',
      weeklyIncome: '',
      eligibilityStatus: 'Pending',
      notes: '',
    };
  }

  /**
   * Extracts unique note categories from a case's notes array.
   * @param {Object} caseObject The case object containing notes.
   * @returns {string[]} Array of unique note categories.
   */
  getUniqueNoteCategories(caseObject) {
    if (!caseObject || !caseObject.notes || !Array.isArray(caseObject.notes)) {
      return [];
    }

    const categories = caseObject.notes
      .map((note) => note.category)
      .filter((category) => category && category.trim() !== '');

    return [...new Set(categories)].sort();
  }

  /**
   * Generates a comprehensive summary of a case for reporting or display purposes.
   * @param {Object} caseObject The case object to summarize.
   * @param {Object} fullData The complete data object containing people and organizations.
   * @returns {Object} A summary object with key case information.
   */
  generateCaseSummary(caseObject, fullData = {}) {
    if (!caseObject) {
      return {
        error: 'No case object provided',
      };
    }

    const people = fullData.people || [];
    const organizations = fullData.organizations || [];

    // Find associated person and organization
    const person = people.find((p) => p.id === caseObject.personId);
    const organization = organizations.find(
      (o) => o.id === caseObject.organizationId,
    );

    // Calculate financial totals
    const flatFinancials = this.getFlatFinancials(caseObject);
    const totalResources = (caseObject.financials?.resources || []).reduce(
      (sum, item) => sum + (parseFloat(item.value) || 0),
      0,
    );
    const totalIncome = (caseObject.financials?.income || []).reduce(
      (sum, item) => sum + (parseFloat(item.value) || 0),
      0,
    );
    const totalExpenses = (caseObject.financials?.expenses || []).reduce(
      (sum, item) => sum + (parseFloat(item.value) || 0),
      0,
    );

    // Count notes by category
    const noteCategories = this.getUniqueNoteCategories(caseObject);
    const noteCounts = noteCategories.reduce((counts, category) => {
      counts[category] = (caseObject.notes || []).filter(
        (note) => note.category === category,
      ).length;
      return counts;
    }, {});

    return {
      // Basic case information
      caseId: caseObject.id,
      caseNumber: caseObject.caseNumber,
      status: caseObject.status,
      type: caseObject.type,
      createdDate: caseObject.createdDate,
      modifiedDate: caseObject.modifiedDate,

      // Associated entities
      person: person
        ? {
            id: person.id,
            name: person.name,
            email: person.email,
            phone: person.phone,
          }
        : null,
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            email: organization.email,
            phone: organization.phone,
          }
        : null,

      // Application details
      appDetails: caseObject.appDetails || this.getDefaultAppDetails(),
      appDateLabel: this.getAppDateLabel(
        caseObject.appDetails?.applicationType,
      ),

      // Financial summary
      financials: {
        totalItems: flatFinancials.length,
        totalResources: totalResources,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        netWorth: totalResources - totalExpenses,
        resourcesCount: (caseObject.financials?.resources || []).length,
        incomeCount: (caseObject.financials?.income || []).length,
        expensesCount: (caseObject.financials?.expenses || []).length,
      },

      // Notes summary
      notes: {
        totalNotes: (caseObject.notes || []).length,
        categories: noteCategories,
        categoryCount: noteCategories.length,
        noteCounts: noteCounts,
      },

      // Metadata
      summary: {
        completeness: this._calculateCompleteness(caseObject),
        lastActivity: caseObject.modifiedDate || caseObject.createdDate,
        hasFinancials: flatFinancials.length > 0,
        hasNotes: (caseObject.notes || []).length > 0,
        hasAppDetails: !!(
          caseObject.appDetails && caseObject.appDetails.appDate
        ),
      },
    };
  }

  /**
   * Opens the VR (Verification Request) application in a new window or tab.
   * @param {string} baseUrl The base URL for the VR application (optional).
   * @param {Object} params Additional parameters to pass to the VR app (optional).
   * @returns {Window|null} Reference to the opened window, or null if failed.
   */
  openVRApp(baseUrl = './nightingale-correspondence.html', params = {}) {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams(params).toString();
      const fullUrl = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

      // Open in new window/tab
      const vrWindow = window.open(
        fullUrl,
        'NightingaleVR',
        'width=1200,height=800,scrollbars=yes,resizable=yes',
      );

      if (!vrWindow) {
        console.warn('Failed to open VR application - popup may be blocked');
        return null;
      }

      return vrWindow;
    } catch (error) {
      console.error('Error opening VR application:', error);
      return null;
    }
  }

  /**
   * Tests financial data migration by validating financial item structure and calculating totals.
   * @param {Object} caseObject The case object to test.
   * @returns {Object} Migration test results with validation details.
   */
  testFinancialMigration(caseObject) {
    if (!caseObject) {
      return {
        success: false,
        error: 'No case object provided',
      };
    }

    const results = {
      success: true,
      warnings: [],
      errors: [],
      summary: {},
    };

    try {
      // Test financial structure
      const financials = caseObject.financials || {};
      const expectedSections = ['resources', 'income', 'expenses'];

      expectedSections.forEach((section) => {
        if (!financials[section]) {
          results.warnings.push(`Missing ${section} section`);
          financials[section] = [];
        } else if (!Array.isArray(financials[section])) {
          results.errors.push(`${section} is not an array`);
          results.success = false;
        }
      });

      // Test individual financial items
      const flatFinancials = this.getFlatFinancials(caseObject);
      const requiredFields = ['type', 'value'];
      const recommendedFields = ['owner', 'location', 'description'];

      flatFinancials.forEach((item, index) => {
        requiredFields.forEach((field) => {
          if (!item[field]) {
            results.errors.push(
              `Item ${index + 1}: Missing required field '${field}'`,
            );
            results.success = false;
          }
        });

        recommendedFields.forEach((field) => {
          if (!item[field]) {
            results.warnings.push(
              `Item ${index + 1}: Missing recommended field '${field}'`,
            );
          }
        });

        // Test numeric value
        const numericValue = parseFloat(item.value);
        if (isNaN(numericValue)) {
          results.errors.push(
            `Item ${index + 1}: Invalid numeric value '${item.value}'`,
          );
          results.success = false;
        }
      });

      // Generate summary
      results.summary = {
        totalItems: flatFinancials.length,
        resourcesCount: (financials.resources || []).length,
        incomeCount: (financials.income || []).length,
        expensesCount: (financials.expenses || []).length,
        warningCount: results.warnings.length,
        errorCount: results.errors.length,
      };
    } catch (error) {
      results.success = false;
      results.errors.push(`Migration test failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Calculate the completeness percentage of a case based on key fields.
   * @param {Object} caseObject The case object to evaluate.
   * @returns {number} Completeness percentage (0-100).
   * @private
   */
  _calculateCompleteness(caseObject) {
    if (!caseObject) return 0;

    const checkpoints = [
      !!caseObject.caseNumber,
      !!caseObject.personId,
      !!caseObject.status,
      !!caseObject.type,
      !!(caseObject.appDetails && caseObject.appDetails.appDate),
      !!(caseObject.appDetails && caseObject.appDetails.applicationType),
      !!(
        caseObject.financials &&
        ((caseObject.financials.resources &&
          caseObject.financials.resources.length > 0) ||
          (caseObject.financials.income &&
            caseObject.financials.income.length > 0) ||
          (caseObject.financials.expenses &&
            caseObject.financials.expenses.length > 0))
      ),
      !!(caseObject.notes && caseObject.notes.length > 0),
    ];

    const completed = checkpoints.filter(Boolean).length;
    return Math.round((completed / checkpoints.length) * 100);
  }
}

// Create singleton instance
const cmsUtilities = new NightingaleCMSUtilities();

// ES6 Module Exports
export default cmsUtilities;
export const {
  getFlatFinancials,
  getAppDateLabel,
  getDefaultAppDetails,
  getUniqueNoteCategories,
  generateCaseSummary,
  openVRApp,
  testFinancialMigration,
} = cmsUtilities;
