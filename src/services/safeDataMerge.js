/**
 * safeDataMerge.js
 * Utility to safely merge partial fullData updates without dropping existing collections.
 * Ensures arrays like people, organizations, cases persist unless explicitly provided.
 */

export function safeMergeFullData(prevFullData, partialUpdate) {
  if (!prevFullData || typeof prevFullData !== 'object')
    return partialUpdate || {};
  if (!partialUpdate || typeof partialUpdate !== 'object')
    return { ...prevFullData };

  const preservedKeys = ['people', 'cases', 'organizations'];
  const result = { ...prevFullData, ...partialUpdate };

  for (const key of preservedKeys) {
    if (
      prevFullData[key] &&
      !Array.isArray(partialUpdate[key]) &&
      partialUpdate[key] == null
    ) {
      // If update omitted the key or set it to null/undefined, restore previous reference
      result[key] = prevFullData[key];
    }
  }
  return result;
}

export default safeMergeFullData;
