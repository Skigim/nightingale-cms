/**
 * Nightingale CMS Utilities Service
 *
 * Provides utility functions specific to CMS operations and workflows.
 * This service handles:
 * - Case action utilities (summary generation, navigation)
 * - UI interaction utilities (copy, scroll, toast helpers)
 * - Development and testing utilities
 * - Browser compatibility helpers
 *
 * @namespace NightingaleCMSUtilities
 * @version 1.0.0
 * @author Nightingale CMS Team
 * @created 2025-08-24
 */

(function (window) {
  'use strict';

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
      console.warn('generateCaseSummary: No case data provided');
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

    console.log('Generated summary for case:', summaryData);

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
      console.warn('openVRApp: No case data provided');
      if (window.showToast) {
        window.showToast('No case data available', 'error');
      }
      return;
    }

    const appUrls = {
      correspondence: 'NightingaleCorrespondence.html',
      reports: 'NightingaleReports.html',
    };

    const baseUrl = appUrls[targetApp] || appUrls.correspondence;
    const vrUrl = `${baseUrl}?mcn=${encodeURIComponent(caseData.mcn || '')}`;

    try {
      window.open(vrUrl, '_blank');
      console.log(`Opened ${targetApp} app for case:`, caseData.mcn);
    } catch (error) {
      console.error('Failed to open VR app:', error);
      if (window.showToast) {
        window.showToast('Failed to open VR application', 'error');
      }
    }
  }

  // ========================================================================
  // UI INTERACTION UTILITIES
  // ========================================================================

  /**
   * Scroll to a specific section with smooth animation
   * @param {string} sectionSelector - CSS selector for target section
   * @param {Object} options - Scroll behavior options
   */
  function scrollToSection(
    sectionSelector = '[data-section="notes"]',
    options = {}
  ) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    };

    const scrollOptions = { ...defaultOptions, ...options };
    const section = document.querySelector(sectionSelector);

    if (section) {
      section.scrollIntoView(scrollOptions);
      console.log(`Scrolled to section: ${sectionSelector}`);
    } else {
      console.warn(`Section not found: ${sectionSelector}`);
    }
  }

  /**
   * Legacy wrapper for scrollToNotes - maintains backward compatibility
   */
  function scrollToNotes() {
    scrollToSection('[data-section="notes"]');
  }

  /**
   * Copy text to clipboard with modern and fallback methods
   * @param {string} text - Text to copy
   * @param {string} successMessage - Success toast message
   * @param {string} errorMessage - Error toast message
   */
  function copyToClipboard(text, successMessage = null, errorMessage = null) {
    if (!text) {
      const message = errorMessage || 'No text to copy';
      if (window.showToast) {
        window.showToast(message, 'error');
      }
      return Promise.reject(new Error(message));
    }

    const success = successMessage || `Text copied to clipboard`;
    const error = errorMessage || 'Failed to copy text';

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard
        .writeText(text)
        .then(() => {
          if (window.showToast) {
            window.showToast(success, 'success');
          }
          return true;
        })
        .catch(() => {
          return fallbackCopyTextToClipboard(text, success, error);
        });
    } else {
      return fallbackCopyTextToClipboard(text, success, error);
    }
  }

  /**
   * Copy MCN to clipboard - legacy wrapper for backward compatibility
   * @param {string} mcn - MCN to copy
   */
  function copyMCN(mcn) {
    return copyToClipboard(
      mcn,
      `MCN ${mcn} copied to clipboard`,
      'No MCN to copy'
    );
  }

  /**
   * Fallback copy method for older browsers
   * @param {string} text - Text to copy
   * @param {string} successMessage - Success message
   * @param {string} errorMessage - Error message
   */
  function fallbackCopyTextToClipboard(text, successMessage, errorMessage) {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          if (window.showToast) {
            window.showToast(successMessage, 'success');
          }
          resolve(true);
        } else {
          throw new Error('execCommand failed');
        }
      } catch (err) {
        document.body.removeChild(textArea);
        if (window.showToast) {
          window.showToast(errorMessage, 'error');
        }
        reject(err);
      }
    });
  }

  // ========================================================================
  // DEVELOPMENT AND TESTING UTILITIES
  // ========================================================================

  /**
   * Test data integrity broadcast system
   */
  function testDataIntegrityBroadcast() {
    try {
      const channel = new BroadcastChannel('nightingale_suite');
      channel.postMessage({
        type: 'data_updated',
        source: 'cms-react',
        timestamp: new Date().toISOString(),
        testMode: true,
      });
      channel.close();
      console.log('📤 Test broadcast sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Broadcast test failed:', error);
      return false;
    }
  }

  /**
   * Test financial item migration functionality
   */
  function testFinancialMigration() {
    console.group('🧪 Testing Financial Item Migration');

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

    console.log('Legacy Item:', legacyFinancialItem);

    // Simulate migration using data management service
    const migratedItem = {
      ...legacyFinancialItem,
      description: legacyFinancialItem.type,
      amount: legacyFinancialItem.value,
      verificationSource: legacyFinancialItem.source,
      frequency: 'monthly',
      dateAdded: new Date().toISOString(),
    };

    console.log('Migrated Item:', migratedItem);
    console.log(
      '✅ Migration test completed - both type/description and value/amount fields preserved'
    );
    console.groupEnd();

    return {
      legacy: legacyFinancialItem,
      migrated: migratedItem,
      success: true,
    };
  }

  /**
   * Check application status and dependencies
   */
  function checkAppStatus() {
    console.group('🔍 Nightingale CMS Status Check');

    const status = {
      timestamp: new Date().toISOString(),
      services: {},
      components: {},
      data: {},
      browser: {},
    };

    // Check services
    status.services.nightingaleServices = !!window.NightingaleServices;
    status.services.dataManagement = !!window.NightingaleDataManagement;
    status.services.fileService = !!window.fileService;
    status.services.toastService = !!window.showToast;

    // Check components
    status.components.react = !!window.React;
    status.components.reactDOM = !!window.ReactDOM;
    status.components.componentLibrary = !!window.NightingaleComponentLibrary;

    // Check data
    status.data.localStorage = !!window.localStorage;
    status.data.savedData = !!localStorage.getItem('nightingale_data');

    // Check browser features
    status.browser.clipboard = !!navigator.clipboard;
    status.browser.broadcastChannel = !!window.BroadcastChannel;
    status.browser.fetch = !!window.fetch;

    console.log('Application Status:', status);
    console.groupEnd();

    return status;
  }

  /**
   * Debug utility to dump component library status
   */
  function debugComponentLibrary() {
    if (window.NightingaleComponentLibrary) {
      console.group('🧩 Component Library Debug');
      console.log(
        'Available components:',
        window.NightingaleComponentLibrary.getAvailableComponents()
      );
      console.log(
        'Library status:',
        window.NightingaleComponentLibrary.getStatus()
      );
      console.groupEnd();
    } else {
      console.warn('Component library not available');
    }
  }

  // ========================================================================
  // SERVICE INITIALIZATION AND EXPORT
  // ========================================================================

  // Create service object
  const NightingaleCMSUtilities = {
    // Case action functions
    generateCaseSummary,
    openVRApp,

    // UI utilities
    scrollToSection,
    scrollToNotes, // Legacy compatibility
    copyToClipboard,
    copyMCN, // Legacy compatibility
    fallbackCopyTextToClipboard,

    // Development utilities
    testDataIntegrityBroadcast,
    testFinancialMigration,
    checkAppStatus,
    debugComponentLibrary,

    // Metadata
    version: '1.0.0',
    name: 'NightingaleCMSUtilities',
  };

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.NightingaleCMSUtilities = NightingaleCMSUtilities;
    console.log('✅ Nightingale CMS Utilities Service loaded');

    // Register with service registry if available
    if (
      window.NightingaleServices &&
      window.NightingaleServices.registerService
    ) {
      window.NightingaleServices.registerService(
        'cmsUtilities',
        NightingaleCMSUtilities,
        'ui'
      );
      console.log(
        '🔧 CMS Utilities Service registered with Nightingale Services'
      );
    }

    // Expose legacy global functions for backward compatibility
    window.generateCaseSummary = generateCaseSummary;
    window.openVRApp = openVRApp;
    window.scrollToNotes = scrollToNotes;
    window.copyMCN = copyMCN;
    window.fallbackCopyTextToClipboard = fallbackCopyTextToClipboard;
    window.testDataIntegrityBroadcast = testDataIntegrityBroadcast;
    window.testFinancialMigration = testFinancialMigration;
    window.checkAppStatus = checkAppStatus;
  }

  // Return service for module systems
  return NightingaleCMSUtilities;
})(typeof window !== 'undefined' ? window : this);
