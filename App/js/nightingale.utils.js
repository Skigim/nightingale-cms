/**
 * Nightingale Application Suite - Shared Utility Functions
 *
 * This file contains common, reusable helper functions for data formatting,
 * validation, and security that are shared across all applications in the suite.
 * By centralizing this logic, we ensure consistency and improve maintainability.
 */

/**
 * Sanitizes a string to prevent HTML injection by converting special characters
 * to their HTML entities.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
function sanitize(str) {
  if (!str) return "";
  return str
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats a date string (e.g., ISO format) into a user-friendly MM/DD/YYYY format.
 * Includes a timezone offset correction to prevent date changes.
 * @param {string} dateString The date string to format.
 * @returns {string} The formatted date, or "N/A" if the input is invalid.
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  // Adjust for timezone offset to prevent the date from changing
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return adjustedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Formats a date string into the YYYY-MM-DD format required by HTML <input type="date"> elements.
 * @param {string} dateString The date string to format.
 * @returns {string} The date in YYYY-MM-DD format, or an empty string if invalid.
 */
function toInputDateFormat(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  // Adjust for timezone offset
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return adjustedDate.toISOString().substring(0, 10);
}

/**
 * Formats a string of numbers into a standard (XXX) XXX-XXXX phone number format.
 * @param {string} value The raw phone number string.
 * @returns {string} The formatted phone number.
 */
function formatPhoneNumber(value) {
  if (!value) return "";
  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7)
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

/**
 * Converts a name string into proper "Firstname Lastname" case.
 * It can handle inputs like "LASTNAME, FIRSTNAME" or "JOHN DOE".
 * @param {string} name The name string to format.
 * @returns {string} The name in proper case.
 */
function formatProperCase(name) {
    if (!name || typeof name !== 'string') return "";
    let processedName = name.trim();

    // Handle "Last, First" format
    if (processedName.includes(',')) {
        const parts = processedName.split(',').map(p => p.trim());
        processedName = `${parts[1] || ''} ${parts[0] || ''}`.trim();
    }

    // Capitalize each word
    return processedName.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Formats a name into "Lastname, Firstname" format for display.
 * @param {string} name The name string to format.
 * @returns {string} The name in "Lastname, Firstname" format.
 */
function formatPersonName(name) {
  if (!name || typeof name !== "string") return "";
  const trimmedName = name.trim();
  if (!trimmedName) return "";

  // If name is already in "Last, First" format, return it as-is
  if (trimmedName.includes(",")) {
    return trimmedName;
  }

  const nameParts = trimmedName.split(/\s+/);
  if (nameParts.length < 2) return trimmedName;

  const lastName = nameParts[nameParts.length - 1];
  const firstMiddleNames = nameParts.slice(0, -1).join(" ");
  return `${lastName}, ${firstMiddleNames}`;
}

/**
 * An object containing a collection of reusable validation functions for forms.
 * Each validator returns an object with { isValid, message, sanitizedValue }.
 */
const Validators = {
  required: (message = "This field is required.") => (value) => ({
    isValid: value && value.toString().trim() !== "",
    message,
    sanitizedValue: value ? value.toString().trim() : "",
  }),

  email: (message = "Please enter a valid email address.") => (value) => ({
    isValid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    message,
    sanitizedValue: value ? value.toString().trim().toLowerCase() : "",
  }),

  phone: (message = "Please enter a valid phone number.") => (value) => {
    const cleaned = value ? value.replace(/\D/g, "") : "";
    return {
      isValid: !value || /^\d{10,}$/.test(cleaned),
      message,
      sanitizedValue: cleaned,
    };
  },

  mcn: (message = "Please enter a valid Master Case Number.") => (value) => {
    const cleaned = value ? value.toString().trim().toUpperCase() : "";
    return {
      isValid: !value || /^[A-Z0-9\-_]{3,}$/.test(cleaned),
      message,
      sanitizedValue: cleaned,
    };
  },

  minLength: (
    length,
    message = `Must be at least ${length} characters.`
  ) => (value) => ({
    isValid: !value || value.trim().length >= length,
    message,
    sanitizedValue: value.trim(),
  }),

  maxLength: (
    length,
    message = `Must be no more than ${length} characters.`
  ) => (value) => ({
    isValid: !value || value.trim().length <= length,
    message,
    sanitizedValue: value.trim(),
  }),
};

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
 * Calculates the next available sequential ID from an array of items.
 * @param {object[]} items An array of objects, each with an 'id' property.
 * @returns {number} The next highest ID.
 */
function getNextId(items) {
    if (!items || items.length === 0) return 1;
    return Math.max(1, ...items.map(item => item.id || 0)) + 1;
}

/**
 * Determines the correct label for the application date field based on the application type.
 * @param {string} applicationType The type of application (e.g., "Application" or "Renewal").
 * @returns {string} The appropriate label.
 */
function getAppDateLabel(applicationType) {
  return applicationType === "Renewal" ? "Renewal Due" : "Application Date";
}

/**
 * Returns a new, default object for application details.
 * @returns {object} The default appDetails object.
 */
function getDefaultAppDetails() {
  return {
    appDate: "",
    caseType: "LTC",
    applicationType: "Application",
    avsConsentDate: "",
    admissionDate: "",
    medicareAExpDate: "",
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