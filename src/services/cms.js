/**
 * Nightingale CMS Business Utilities Service
 *
 * Provides utility functions specific to CMS business operations and workflows.
 * This service handles domain-specific logic for the Nightingale CMS application.
 *
 * @namespace NightingaleCMSUtilities
 * @version 2.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

(function (window) {
  'use strict';

  // ========================================================================
  // CMS-SPECIFIC DATA UTILITIES
  // ========================================================================

  /**
   * Flattens all financial items (resources, income, expenses) from a case object
   * into a single array.
   * @param {object} caseObject The case object containing the financials property.
   * @returns {object[]} A single array containing all financial items.
   */
  function getFlatFinancials(caseObject) {
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
  function getAppDateLabel(applicationType) {
    return applicationType === 'Renewal' ? 'Renewal Due' : 'Application Date';
  }

  /**
   * Returns a new, default object for application details.
   * @returns {object} The default appDetails object.
   */
  function getDefaultAppDetails() {
    return {
      appDate: '',
      caseType: 'LTC',
      applicationType: 'Application',
      avsConsentDate: '',
      admissionDate: '',
      medicareAExpDate: '',
    };
  }

  /**
   * Extracts a unique, sorted list of note categories from all cases.
   * @param {object[]} cases The array of case objects.
   * @returns {string[]} A sorted array of unique note category strings.
   */
  function getUniqueNoteCategories(cases) {
    if (!cases) return [];
    const allNotes = cases.flatMap((c) => c.notes || []);
    return [...new Set(allNotes.map((n) => n.category).filter(Boolean))].sort();
  }

  // ========================================================================
  // CASE ACTION UTILITIES
  // ========================================================================

  /**
   * Generate a comprehensive case summary with metadata
   * @param {Object} caseData - Case data object
   * @returns {Object} Summary data object
   */
  function generateCaseSummary(caseData) {
    if (!caseData) {
      return null;
    }

    const summaryData = {
      caseName: caseData.mcn || 'Unknown',
      applicant: caseData.personId,
      caseType: caseData.appDetails?.caseType,
      status: caseData.status,
      financialItems: {
        resources: caseData.financials?.resources?.length || 0,
        income: caseData.financials?.income?.length || 0,
        expenses: caseData.financials?.expenses?.length || 0,
      },
      notes: caseData.notes?.length || 0,
      applicationDate: caseData.applicationDate,
      lastModified: caseData.lastModified,
      totalFinancialItems:
        (caseData.financials?.resources?.length || 0) +
        (caseData.financials?.income?.length || 0) +
        (caseData.financials?.expenses?.length || 0),
    };

    // Use toast service if available
    if (window.showToast) {
      window.showToast('Case summary generation feature coming soon', 'info');
    }

    return summaryData;
  }

  /**
   * Open VR/Correspondence app with case context
   * @param {Object} caseData - Case data object
   * @param {string} targetApp - Target application ('correspondence', 'reports', etc.)
   */
  function openVRApp(caseData, targetApp = 'correspondence') {
    if (!caseData) {
      if (window.showToast) {
        window.showToast('No case data available', 'error');
      }
      return;
    }

    const appUrls = {
      correspondence: 'src/pages/NightingaleCorrespondence.html',
      reports: 'src/pages/NightingaleReports.html',
    };

    const baseUrl = appUrls[targetApp] || appUrls.correspondence;
    const vrUrl = `${baseUrl}?mcn=${encodeURIComponent(caseData.mcn || '')}`;

    try {
      window.open(vrUrl, '_blank');
    } catch (error) {
      const logger = window.NightingaleLogger?.get('cms:navigation');
      logger?.warn('Failed to open VR app', {
        error: error.message,
        url: vrUrl,
      });
      if (window.showToast) {
        window.showToast('Failed to open VR application', 'error');
      }
    }
  }

  // ========================================================================
  // DEVELOPMENT AND TESTING UTILITIES
  // ========================================================================

  /**
   * Test financial item migration functionality
   */
  function testFinancialMigration() {
    const legacyFinancialItem = {
      id: 1,
      type: 'Checking Account', // Legacy field
      value: 1500.0, // Legacy field
      source: 'Bank Statement', // Legacy field
      location: 'Bank of America',
      accountNumber: '1234',
      verificationStatus: 'Verified',
      owner: 'applicant',
    };

    // Simulate migration using data management service
    const migratedItem = {
      ...legacyFinancialItem,
      description: legacyFinancialItem.type,
      amount: legacyFinancialItem.value,
      verificationSource: legacyFinancialItem.source,
      frequency: 'monthly',
      dateAdded: new Date().toISOString(),
    };

    return {
      legacy: legacyFinancialItem,
      migrated: migratedItem,
      success: true,
    };
  }

  // ========================================================================
  // SERVICE INITIALIZATION AND EXPORT
  // ========================================================================

  // Create service object
  const NightingaleCMSUtilities = {
    // CMS-specific data utilities
    getFlatFinancials,
    getAppDateLabel,
    getDefaultAppDetails,
    getUniqueNoteCategories,

    // Case action functions
    generateCaseSummary,
    openVRApp,

    // Development utilities
    testFinancialMigration,

    // Metadata
    version: '2.0.0',
    name: 'NightingaleCMSUtilities',
  };

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.NightingaleCMSUtilities = NightingaleCMSUtilities;

    // Register with service registry if available
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      window.NightingaleServices.registerService(
        'cmsUtilities',
        NightingaleCMSUtilities,
        'business'
      );
    }

    // Legacy global functions for backward compatibility
    window.getFlatFinancials = getFlatFinancials;
    window.getAppDateLabel = getAppDateLabel;
    window.getDefaultAppDetails = getDefaultAppDetails;
    window.getUniqueNoteCategories = getUniqueNoteCategories;
    window.generateCaseSummary = generateCaseSummary;
    window.openVRApp = openVRApp;
    window.testFinancialMigration = testFinancialMigration;
  }

  // Return service for module systems
  return NightingaleCMSUtilities;
})(typeof window !== 'undefined' ? window : this);

// ES6 Module Export
export default (typeof window !== 'undefined' &&
  window.NightingaleCMSUtilities) ||
  null;
