/**
 * Nightingale Application Suite - Shared Search Service
 *
 * This service provides a standardized, reusable wrapper around the Fuse.js
 * library for powerful, client-side fuzzy searching of application data.
 */
class NightingaleSearchService {
  /**
   * Creates an instance of the search service.
   * @param {Array<Object>} documents The array of objects to search (e.g., state.cases).
   * @param {Object} options The Fuse.js configuration options.
   * - keys: An array of strings representing the object keys to search in.
   * - threshold: A number from 0.0 to 1.0 indicating search sensitivity.
   */
  constructor(documents = [], options = {}) {
    const defaultOptions = {
      keys: [],
      includeScore: false,
      threshold: 0.3, // A good starting point for general purpose search
      ignoreLocation: true,
    };

    this.fuse = new Fuse(documents, { ...defaultOptions, ...options });
  }

  /**
   * Performs a search against the documents.
   * @param {string} query The search term.
   * @returns {Array<Object>} An array of the matching original objects.
   */
  search(query) {
    if (!query || !query.trim()) {
      // If the query is empty, return the full, original list.
      return this.fuse.getIndex().docs;
    }
    // Fuse.js returns results in a specific format; we map it to return just the original items.
    return this.fuse.search(query).map(result => result.item);
  }

  /**
   * Updates the entire collection of documents to be searched.
   * Useful when the underlying state data changes.
   * @param {Array<Object>} newDocuments The new array of objects.
   */
  updateCollection(newDocuments) {
    this.fuse.setCollection(newDocuments);
  }
}