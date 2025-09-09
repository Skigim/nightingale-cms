/**
 * Nightingale Application Suite - Shared Parser Functions
 *
 * This file contains logic for parsing complex, external data formats,
 * such as raw text from AVS bank data reports.
 */

/**
 * Parses a block of text representing a single bank account from an AVS report.
 * @param {string} block - The raw text block for one account.
 * @param {string[]} knownAccountTypes - An array of account type strings to help with parsing (e.g., ['Checking Account', 'Savings']).
 * @returns {object|null} A structured object with the parsed account data, or null if parsing fails.
 */
function parseAvsAccountBlock(block, knownAccountTypes) {
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

  let accountNumber = accountNumberMatch ? accountNumberMatch[1].trim() : 'N/A';
  if (accountNumber !== 'N/A' && accountNumber.length > 4) {
    accountNumber = accountNumber.slice(-4);
  }

  // Map the parsed data to the field names used in our financial items
  return {
    type: accountType.replace(/ account/i, '').trim(), // Remove the word "Account" for consistency
    owner: ownerList, // This field is for display; the user will assign the final owner
    location: bankNameMatch ? bankNameMatch[1].trim() : 'N/A',
    accountNumber: accountNumber,
    // Use a more robust regex to remove any non-numeric characters (except the decimal) before parsing.
    value: balanceMatch
      ? parseFloat(balanceMatch[1].replace(/[^0-9.]/g, '')) || 0
      : 0,
    verificationStatus: 'Verified', // Data from AVS is considered verified
    source: `AVS as of ${window.dateUtils.formatToday()}`,
  };
}

/**
 * The main function to parse a full raw AVS data dump.
 * @param {string} rawInput - The entire pasted text from the AVS report.
 * @param {string[]} knownAccountTypes - An array of account type strings.
 * @returns {object[]} An array of structured account objects.
 */
function parseAvsData(rawInput, knownAccountTypes) {
  if (!rawInput || !rawInput.trim()) {
    return [];
  }
  // Split the entire input text into blocks, where each block starts with "Account Owner: "
  const accountBlocks = rawInput
    .split(/Account Owner: /)
    .filter((block) => block.trim() !== '');
  if (accountBlocks.length === 0) {
    return [];
  }
  // Parse each block and filter out any that are invalid
  const parsedAccounts = accountBlocks
    .map((block) => parseAvsAccountBlock(block, knownAccountTypes))
    .filter(Boolean);
  return parsedAccounts;
}

// Make parser functions available globally
window.parseAvsAccountBlock = parseAvsAccountBlock;
window.parseAvsData = parseAvsData;

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseAvsAccountBlock,
    parseAvsData,
  };
}

// ES6 Module Export
export default { parseAvsAccountBlock, parseAvsData };
export { parseAvsAccountBlock, parseAvsData };
