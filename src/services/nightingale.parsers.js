/**
 * Nightingale Parsers Service
 *
 * Provides data parsing utilities for external formats, particularly AVS bank data reports.
 * Handles complex text parsing with account type detection and financial data extraction.
 *
 * Features:
 * - AVS bank data parsing with flexible account type recognition
 * - Account number formatting and balance extraction
 * - Robust data validation and error handling
 * - Date formatting integration with NightingaleDayJS
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */

import NightingaleDayJS from './nightingale.dayjs.js';

/**
 * Parsers Service for handling external data format parsing
 */
class NightingaleParsers {
  constructor() {
    this.dateService = NightingaleDayJS;
  }

  /**
   * Parses a block of text representing a single bank account from an AVS report.
   * @param {string} block - The raw text block for one account.
   * @param {string[]} knownAccountTypes - An array of account type strings to help with parsing (e.g., ['Checking Account', 'Savings']).
   * @returns {object|null} A structured object with the parsed account data, or null if parsing fails.
   */
  parseAvsAccountBlock(block, knownAccountTypes = []) {
    // Input validation
    if (!block || typeof block !== 'string') return null;
    if (!Array.isArray(knownAccountTypes)) knownAccountTypes = [];

    const lines = block.split('\n').filter((line) => line.trim() !== '');
    if (lines.length < 2) return null;

    const firstLine = lines[0].trim();
    let accountType = 'N/A';
    let owners = 'N/A';

    // Sort known types by length, descending, to match longer phrases first (e.g., "Checking Account" before "Checking").
    const sortedAccountTypes = [...knownAccountTypes].sort(
      (a, b) => b.length - a.length,
    );

    for (const type of sortedAccountTypes) {
      // Use a case-insensitive match at the end of the line
      if (firstLine.toUpperCase().endsWith(type.toUpperCase())) {
        accountType = type;
        owners = firstLine.slice(0, -type.length).trim();
        break;
      }
    }

    if (accountType === 'N/A') {
      // If no specific type was found, assume the whole first line is the owner(s)
      owners = firstLine;
    }

    const ownerList = owners
      .split(';')
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
      .join(', ');

    const bankLine = lines[1] || '';
    const bankNameMatch = bankLine.match(/([^\n]+) - \(/);
    const accountNumberMatch = bankLine.match(/ - \((\d+)\)/);

    const balanceLine = lines.find((l) =>
      l.toLowerCase().includes('balance as of'),
    );
    const balanceMatch = balanceLine
      ? balanceLine.match(/Balance as of .* - (.*)/)
      : null;

    let accountNumber = accountNumberMatch
      ? accountNumberMatch[1].trim()
      : 'N/A';
    if (accountNumber !== 'N/A' && accountNumber.length > 4) {
      accountNumber = accountNumber.slice(-4);
    }

    // Get current date for source field
    const today = this.dateService.formatToday();

    // Map the parsed data to the field names used in our financial items
    return {
      type: accountType.replace(/ account/i, '').trim(), // Remove the word "Account" for consistency
      owner: ownerList, // This field is for display; the user will assign the final owner
      location: bankNameMatch ? bankNameMatch[1].trim() : 'N/A',
      accountNumber: accountNumber,
      // Use a more robust regex to remove any non-numeric characters (except the decimal) before parsing.
      value: balanceMatch
        ? parseFloat(balanceMatch[1].replace(/[^0-9.-]/g, '')) || 0
        : 0,
      verificationStatus: 'Verified', // Data from AVS is considered verified
      source: `AVS as of ${today}`,
    };
  }

  /**
   * The main function to parse a full raw AVS data dump.
   * @param {string} rawInput - The entire pasted text from the AVS report.
   * @param {string[]} knownAccountTypes - An array of account type strings.
   * @returns {object[]} An array of structured account objects.
   */
  parseAvsData(rawInput, knownAccountTypes = []) {
    // Input validation
    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return [];
    }
    if (!Array.isArray(knownAccountTypes)) knownAccountTypes = [];

    // Split the entire input text into blocks, where each block starts with "Account Owner: "
    const accountBlocks = rawInput
      .split(/Account Owner: /)
      .filter((block) => block.trim() !== '');

    if (accountBlocks.length === 0) {
      return [];
    }

    // Parse each block and filter out any that are invalid
    const parsedAccounts = accountBlocks
      .map((block) => this.parseAvsAccountBlock(block, knownAccountTypes))
      .filter(Boolean);

    return parsedAccounts;
  }
}

// Create singleton instance
const parsersInstance = new NightingaleParsers();

// ES6 Module Exports
export default parsersInstance;
export const { parseAvsAccountBlock, parseAvsData } = parsersInstance;
