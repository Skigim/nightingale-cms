/**
 * Nightingale Placeholder Processing Service
 *
 * Handles dynamic placeholder replacement in templates with case data.
 * Provides comprehensive placeholder processing for document generation
 * with support for date formatting, person/organization data, and custom replacements.
 *
 * Features:
 * - Dynamic placeholder replacement with {Placeholder} syntax
 * - Date formatting integration with NightingaleDayJS
 * - Person and organization data processing
 * - Custom replacement support
 * - Comprehensive error handling and input validation
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

import NightingaleDayJS from './nightingale.dayjs.js';

/**
 * Placeholder Processing Service
 */
class NightingalePlaceholders {
  constructor() {
    this.dateService = NightingaleDayJS;
  }

  /**
   * Process template content by replacing placeholders with actual case data
   * @param {string} templateContent - Template text with {Placeholder} syntax
   * @param {Object} activeCase - Current case object
   * @param {Object} fullData - Complete data object with people, organizations, etc.
   * @param {Object} customReplacements - Additional custom placeholder values
   * @returns {string} Processed template with placeholders replaced
   */
  processPlaceholders(
    templateContent,
    activeCase,
    fullData,
    customReplacements = {},
  ) {
    // Input validation
    if (!templateContent || typeof templateContent !== 'string') {
      return templateContent || '';
    }

    if (!activeCase) {
      return templateContent;
    }

    if (!fullData) {
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

    // Get today's date formatted using our date service
    const todayFormatted = this.dateService.formatToday();
    const todayLong = this.dateService.formatDate(
      this.dateService.now(),
      'MMMM D, YYYY',
    );

    // Build the comprehensive placeholder mapping
    const placeholderMap = {
      // Date placeholders
      TodayDate: todayFormatted,
      TodayLong: todayLong,
      TodayDateFormatted: todayLong,

      // Person placeholders
      PersonName: person?.name || '',
      PersonFirstName: person?.firstName || '',
      PersonLastName: person?.lastName || '',
      PersonMiddleName: person?.middleName || '',
      PersonSSN: person?.ssn || '',
      PersonSSNFormatted: this._formatSSN(person?.ssn) || '',
      PersonDOB: person?.dateOfBirth || '',
      PersonDOBFormatted: this._formatDate(person?.dateOfBirth) || '',
      PersonAddress: this._formatAddress(person) || '',
      PersonPhone: person?.phone || '',
      PersonPhoneFormatted: this._formatPhone(person?.phone) || '',
      PersonEmail: person?.email || '',

      // Organization placeholders
      OrganizationName: organization?.name || '',
      OrganizationAddress: this._formatAddress(organization) || '',
      OrganizationPhone: organization?.phone || '',
      OrganizationPhoneFormatted: this._formatPhone(organization?.phone) || '',
      OrganizationEmail: organization?.email || '',
      OrganizationEIN: organization?.ein || '',
      OrganizationEINFormatted: this._formatEIN(organization?.ein) || '',

      // Primary contact placeholders
      ContactName: primaryContact?.name || '',
      ContactFirstName: primaryContact?.firstName || '',
      ContactLastName: primaryContact?.lastName || '',
      ContactTitle: primaryContact?.title || '',
      ContactPhone: primaryContact?.phone || '',
      ContactPhoneFormatted: this._formatPhone(primaryContact?.phone) || '',
      ContactEmail: primaryContact?.email || '',

      // Case placeholders
      CaseNumber: activeCase?.caseNumber || '',
      CaseType: activeCase?.type || '',
      CaseStatus: activeCase?.status || '',
      ApplicationDate: activeCase?.appDetails?.appDate || '',
      ApplicationDateFormatted:
        this._formatDate(activeCase?.appDetails?.appDate) || '',
      ApplicationType: activeCase?.appDetails?.applicationType || '',
      PovertyGuidelines: activeCase?.appDetails?.povertyGuidelines || '',
      HouseholdSize: activeCase?.appDetails?.householdSize || '',
      HouseholdIncome: activeCase?.appDetails?.totalIncome || '',
      HouseholdIncomeFormatted:
        this._formatCurrency(activeCase?.appDetails?.totalIncome) || '',

      // Financial placeholders
      TotalAssets: this._getTotalAssets(activeCase) || '',
      TotalAssetsFormatted:
        this._formatCurrency(this._getTotalAssets(activeCase)) || '',
      TotalIncome: this._getTotalIncome(activeCase) || '',
      TotalIncomeFormatted:
        this._formatCurrency(this._getTotalIncome(activeCase)) || '',
      TotalExpenses: this._getTotalExpenses(activeCase) || '',
      TotalExpensesFormatted:
        this._formatCurrency(this._getTotalExpenses(activeCase)) || '',

      // Custom replacements (override any defaults)
      ...customReplacements,
    };

    // Replace all placeholders in the template
    let processedContent = templateContent;

    // Find all placeholder patterns {PlaceholderName}
    const placeholderRegex = /\{([^}]+)\}/g;

    processedContent = processedContent.replace(
      placeholderRegex,
      (match, placeholderName) => {
        // Check if we have a replacement for this placeholder
        if (Object.hasOwn(placeholderMap, placeholderName)) {
          const replacement = placeholderMap[placeholderName];
          return replacement !== null && replacement !== undefined
            ? String(replacement)
            : '';
        }

        // If no replacement found, return the original placeholder
        return match;
      },
    );

    return processedContent;
  }

  /**
   * Primary method for processing template placeholders (alias)
   */
  process(templateContent, activeCase, fullData, customReplacements = {}) {
    return this.processPlaceholders(
      templateContent,
      activeCase,
      fullData,
      customReplacements,
    );
  }

  /**
   * Format SSN with standard XXX-XX-XXXX pattern
   * @param {string} ssn - Raw SSN string
   * @returns {string} Formatted SSN or empty string
   */
  _formatSSN(ssn) {
    if (!ssn || typeof ssn !== 'string') return '';

    // Remove all non-digits
    const digits = ssn.replace(/\D/g, '');

    if (digits.length === 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }

    return ssn; // Return original if not 9 digits
  }

  /**
   * Format EIN with standard XX-XXXXXXX pattern
   * @param {string} ein - Raw EIN string
   * @returns {string} Formatted EIN or empty string
   */
  _formatEIN(ein) {
    if (!ein || typeof ein !== 'string') return '';

    // Remove all non-digits
    const digits = ein.replace(/\D/g, '');

    if (digits.length === 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }

    return ein; // Return original if not 9 digits
  }

  /**
   * Format phone number with standard (XXX) XXX-XXXX pattern
   * @param {string} phone - Raw phone string
   * @returns {string} Formatted phone or empty string
   */
  _formatPhone(phone) {
    if (!phone || typeof phone !== 'string') return '';

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone; // Return original if not 10 digits
  }

  /**
   * Format date using the date service
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date or empty string
   */
  _formatDate(dateString) {
    if (!dateString) return '';

    try {
      return this.dateService.formatDate(dateString, 'MMMM D, YYYY');
    } catch (error) {
      return dateString; // Return original if formatting fails
    }
  }

  /**
   * Format currency amount
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted currency or empty string
   */
  _formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') return '';

    const numericAmount =
      typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) return '';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount);
  }

  /**
   * Format address from person or organization object
   * @param {Object} entity - Person or organization object
   * @returns {string} Formatted address
   */
  _formatAddress(entity) {
    if (!entity) return '';

    const parts = [];

    if (entity.address) parts.push(entity.address);
    if (entity.city) parts.push(entity.city);
    if (entity.state) parts.push(entity.state);
    if (entity.zipCode) parts.push(entity.zipCode);

    return parts.join(', ');
  }

  /**
   * Calculate total assets from case financial data
   * @param {Object} activeCase - Case object
   * @returns {number} Total assets
   */
  _getTotalAssets(activeCase) {
    if (!activeCase?.financials?.resources) return 0;

    return activeCase.financials.resources.reduce((total, resource) => {
      const value = parseFloat(resource.value) || 0;
      return total + value;
    }, 0);
  }

  /**
   * Calculate total income from case financial data
   * @param {Object} activeCase - Case object
   * @returns {number} Total income
   */
  _getTotalIncome(activeCase) {
    if (!activeCase?.financials?.income) return 0;

    return activeCase.financials.income.reduce((total, income) => {
      const value = parseFloat(income.value) || 0;
      return total + value;
    }, 0);
  }

  /**
   * Calculate total expenses from case financial data
   * @param {Object} activeCase - Case object
   * @returns {number} Total expenses
   */
  _getTotalExpenses(activeCase) {
    if (!activeCase?.financials?.expenses) return 0;

    return activeCase.financials.expenses.reduce((total, expense) => {
      const value = parseFloat(expense.value) || 0;
      return total + value;
    }, 0);
  }

  /**
   * Get available placeholder names for template building
   * @returns {string[]} Array of available placeholder names
   */
  getAvailablePlaceholders() {
    return [
      'TodayDate',
      'TodayLong',
      'TodayDateFormatted',
      'PersonName',
      'PersonFirstName',
      'PersonLastName',
      'PersonMiddleName',
      'PersonSSN',
      'PersonSSNFormatted',
      'PersonDOB',
      'PersonDOBFormatted',
      'PersonAddress',
      'PersonPhone',
      'PersonPhoneFormatted',
      'PersonEmail',
      'OrganizationName',
      'OrganizationAddress',
      'OrganizationPhone',
      'OrganizationPhoneFormatted',
      'OrganizationEmail',
      'OrganizationEIN',
      'OrganizationEINFormatted',
      'ContactName',
      'ContactFirstName',
      'ContactLastName',
      'ContactTitle',
      'ContactPhone',
      'ContactPhoneFormatted',
      'ContactEmail',
      'CaseNumber',
      'CaseType',
      'CaseStatus',
      'ApplicationDate',
      'ApplicationDateFormatted',
      'ApplicationType',
      'PovertyGuidelines',
      'HouseholdSize',
      'HouseholdIncome',
      'HouseholdIncomeFormatted',
      'TotalAssets',
      'TotalAssetsFormatted',
      'TotalIncome',
      'TotalIncomeFormatted',
      'TotalExpenses',
      'TotalExpensesFormatted',
    ];
  }
}

// Create singleton instance
const placeholderService = new NightingalePlaceholders();

// ES6 Module Exports
export default placeholderService;
export const { processPlaceholders, getAvailablePlaceholders } =
  placeholderService;
