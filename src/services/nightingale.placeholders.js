/**
 * Nightingale Placeholder Processing Service
 *
 * Extracted from NightingaleCorrespondence.html
 * Handles dynamic placeholder replacement in templates with case data
 *
 * Dependencies: nightingale.dayjs.js for date formatting
 */

(function () {
  'use strict';

  /**
   * Process template content by replacing placeholders with actual case data
   * @param {string} templateContent - Template text with {Placeholder} syntax
   * @param {Object} activeCase - Current case object
   * @param {Object} fullData - Complete data object with people, organizations, etc.
   * @param {Object} customReplacements - Additional custom placeholder values
   * @returns {string} Processed template with placeholders replaced
   */
  function processPlaceholders(
    templateContent,
    activeCase,
    fullData,
    customReplacements = {}
  ) {
    // Input validation
    if (!templateContent || typeof templateContent !== 'string') {
      console.warn('PlaceholderService: Invalid template content provided');
      return templateContent || '';
    }

    if (!activeCase) {
      console.warn('PlaceholderService: No active case provided');
      return templateContent;
    }

    if (!fullData) {
      console.warn('PlaceholderService: No full data provided');
      return templateContent;
    }

    // Add null safety for arrays that might not exist
    const people = fullData?.people || [];
    const organizations = fullData?.organizations || [];

    const person = people.find((p) => p.id === activeCase.personId);

    // Find organization - check case first, then person
    const organizationId = activeCase.organizationId || person?.organizationId;
    const organization = organizationId
      ? organizations.find((o) => o.id === organizationId)
      : null;

    // Find primary contact - look for Administrator first, then any personnel
    const primaryContact =
      organization?.personnel?.find((p) => p.title === 'Administrator') ||
      organization?.personnel?.find((p) => p.title === 'BOM') ||
      organization?.personnel?.[0] ||
      null;

    // Get today's date formatted (requires dateUtils from nightingale.dayjs.js)
    const todayFormatted = window.dateUtils
      ? window.dateUtils.format(window.dateUtils.now())
      : new Date().toLocaleDateString();

    const replacements = {
      // Client Information
      ClientName: person?.name || '[CLIENT NAME]',
      ClientAddress:
        activeCase?.address || person?.address || '[CLIENT ADDRESS]',
      ClientCity: activeCase?.city || person?.city || '[CLIENT CITY]',
      ClientState: activeCase?.state || person?.state || '[CLIENT STATE]',
      ClientZip: activeCase?.zipCode || person?.zipCode || '[CLIENT ZIP]',
      ClientPhone: activeCase?.phone || person?.phone || '[CLIENT PHONE]',
      ClientEmail: activeCase?.email || person?.email || '[CLIENT EMAIL]',

      // Case Information
      MCN: activeCase?.mcn || '[MCN]',
      CaseStatus: activeCase?.status || '[CASE STATUS]',
      CaseType: activeCase?.caseType || '[CASE TYPE]',
      CasePriority: activeCase?.priority || '[CASE PRIORITY]',
      ApplicationDate:
        activeCase?.applicationDate && window.dateUtils
          ? window.dateUtils.format(activeCase.applicationDate)
          : '[APPLICATION DATE]',
      TodayDate: todayFormatted,

      // Organization placeholders
      OrganizationName: organization?.name || '[ORGANIZATION NAME]',
      OrganizationPhone: organization?.phone || '[ORGANIZATION PHONE]',
      AdminName:
        primaryContact?.name ||
        organization?.contactPerson ||
        '[ADMINISTRATOR NAME]',
      AdminPhone:
        primaryContact?.phone || organization?.phone || '[ADMINISTRATOR PHONE]',

      // Due date (calculated based on current date + 15 days by default)
      DueDate: window.dateUtils
        ? window.dateUtils.format(window.dateUtils.addDays(15))
        : '[DUE DATE]',

      // Financial placeholders - map to actual case financial data
      TotalIncome: formatFinancialValue(
        activeCase?.finances?.income?.total,
        '[TOTAL INCOME]'
      ),
      EmploymentIncome: formatFinancialValue(
        activeCase?.finances?.income?.employment,
        '[EMPLOYMENT INCOME]'
      ),
      DisabilityIncome: formatFinancialValue(
        activeCase?.finances?.income?.disability,
        '[DISABILITY INCOME]'
      ),
      TotalExpenses: formatFinancialValue(
        activeCase?.finances?.expenses?.total,
        '[TOTAL EXPENSES]'
      ),
      HousingCost: formatFinancialValue(
        activeCase?.finances?.expenses?.housing,
        '[HOUSING COST]'
      ),

      // Legacy financial placeholders (for backward compatibility)
      ItemName: '[FINANCIAL ITEM]',
      Location: '[INSTITUTION]',
      AccountNumber: '[ACCOUNT NUMBER]',
      Value: '[AMOUNT]',

      ...customReplacements,
    };

    let processed = templateContent;
    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, replacements[key]);
    });

    return processed;
  }

  /**
   * Get list of available placeholders with descriptions
   * @returns {Object} Grouped placeholders with descriptions
   */
  function getAvailablePlaceholders() {
    return {
      'Client Info': [
        { key: 'ClientName', description: 'Client full name' },
        { key: 'ClientAddress', description: 'Client street address' },
        { key: 'ClientCity', description: 'Client city' },
        { key: 'ClientState', description: 'Client state' },
        { key: 'ClientZip', description: 'Client ZIP code' },
        { key: 'ClientPhone', description: 'Client phone number' },
        { key: 'ClientEmail', description: 'Client email address' },
      ],
      'Case Info': [
        { key: 'MCN', description: 'Medical Case Number' },
        { key: 'CaseStatus', description: 'Current case status' },
        { key: 'CaseType', description: 'Case type (SIMP, etc.)' },
        { key: 'CasePriority', description: 'Case priority level' },
        { key: 'ApplicationDate', description: 'Case application date' },
      ],
      Organization: [
        { key: 'OrganizationName', description: 'Organization name' },
        { key: 'OrganizationPhone', description: 'Organization phone number' },
        { key: 'AdminName', description: 'Administrator contact name' },
        { key: 'AdminPhone', description: 'Administrator phone number' },
      ],
      Financial: [
        {
          key: 'TotalIncome',
          description: 'Total monthly income (formatted currency)',
        },
        {
          key: 'EmploymentIncome',
          description: 'Employment income (formatted currency)',
        },
        {
          key: 'DisabilityIncome',
          description: 'Disability income (formatted currency)',
        },
        {
          key: 'TotalExpenses',
          description: 'Total monthly expenses (formatted currency)',
        },
        {
          key: 'HousingCost',
          description: 'Housing expenses (formatted currency)',
        },
        // Legacy placeholders
        { key: 'ItemName', description: 'Financial item name (legacy)' },
        {
          key: 'Location',
          description: 'Financial institution location (legacy)',
        },
        { key: 'AccountNumber', description: 'Account number (legacy)' },
        { key: 'Value', description: 'Financial amount (legacy)' },
      ],
      Dates: [
        { key: 'TodayDate', description: 'Current date' },
        { key: 'DueDate', description: 'Due date (15 days from today)' },
      ],
    };
  }

  /**
   * Validate that all placeholders in content can be resolved
   * @param {string} content - Template content to validate
   * @returns {Object} Validation result with valid/invalid placeholders
   */
  function validatePlaceholders(content) {
    const placeholderRegex = /\{([^}]+)\}/g;
    const availablePlaceholders = getAvailablePlaceholders();
    const allAvailableKeys = Object.values(availablePlaceholders)
      .flat()
      .map((p) => p.key);

    const foundPlaceholders = [];
    let match;

    while ((match = placeholderRegex.exec(content)) !== null) {
      foundPlaceholders.push(match[1]);
    }

    const uniquePlaceholders = [...new Set(foundPlaceholders)];
    const validPlaceholders = uniquePlaceholders.filter((p) =>
      allAvailableKeys.includes(p)
    );
    const invalidPlaceholders = uniquePlaceholders.filter(
      (p) => !allAvailableKeys.includes(p)
    );

    return {
      valid: validPlaceholders,
      invalid: invalidPlaceholders,
      total: uniquePlaceholders.length,
      isValid: invalidPlaceholders.length === 0,
    };
  }

  /**
   * Format currency amount consistently
   * @param {number} amount - Numeric amount
   * @returns {string} Formatted currency string
   */
  function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return '[INVALID AMOUNT]';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  /**
   * Safely format financial values with proper fallbacks
   * @param {number} amount - Numeric amount
   * @param {string} fallback - Fallback text if amount is invalid
   * @returns {string} Formatted currency string or fallback
   */
  function formatFinancialValue(amount, fallback = '[AMOUNT]') {
    if (typeof amount === 'number' && !isNaN(amount)) {
      return formatCurrency(amount);
    }
    return fallback;
  }

  /**
   * Format date consistently using dateUtils if available
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  function formatDate(date) {
    if (!date) return '[INVALID DATE]';

    if (window.dateUtils) {
      return window.dateUtils.format(date);
    }

    // Fallback formatting
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  /**
   * Get preview value for a specific placeholder
   * @param {string} placeholderKey - The placeholder key (without braces)
   * @param {Object} activeCase - Current case data
   * @param {Object} fullData - Full data context
   * @returns {string} Preview value for the placeholder
   */
  function getPlaceholderPreview(placeholderKey, activeCase, fullData) {
    const dummyTemplate = `{${placeholderKey}}`;
    const processed = processPlaceholders(dummyTemplate, activeCase, fullData);
    return processed;
  }

  /**
   * Debug function to show all placeholder values for current context
   * @param {Object} activeCase - Current case data
   * @param {Object} fullData - Full data context
   * @returns {Object} All placeholder values with their current resolved values
   */
  function debugPlaceholders(activeCase, fullData) {
    if (!activeCase || !fullData) {
      return { error: 'Missing required data for debugging' };
    }

    const availablePlaceholders = getAvailablePlaceholders();
    const debug = {};

    Object.entries(availablePlaceholders).forEach(
      ([category, placeholders]) => {
        debug[category] = {};
        placeholders.forEach(({ key, description }) => {
          const value = getPlaceholderPreview(key, activeCase, fullData);
          debug[category][key] = {
            description,
            value,
            isResolved: !value.startsWith('[') || !value.endsWith(']'),
          };
        });
      }
    );

    return debug;
  }

  // Service API
  const PlaceholderService = {
    processPlaceholders,
    getAvailablePlaceholders,
    validatePlaceholders,
    formatCurrency,
    formatFinancialValue,
    formatDate,
    getPlaceholderPreview,
    debugPlaceholders,
  };

  // Register with global services
  if (typeof window !== 'undefined') {
    // Primary registration
    window.NightingalePlaceholderService = PlaceholderService;

    // Secondary registration with services collection
    window.NightingaleServices = window.NightingaleServices || {};
    window.NightingaleServices.placeholderService = PlaceholderService;

    // Backward compatibility - register individual functions
    window.processPlaceholders = processPlaceholders;

    console.log('🏷️ Placeholder Service initialized');
  }

  // Export for module environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaceholderService;
  }
})();

// ES6 Module Export
export default (typeof window !== 'undefined' &&
  window.NightingalePlaceholders) ||
  null;
