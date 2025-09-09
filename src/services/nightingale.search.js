// Nightingale Search Service (modernized with fuse.js npm package)
import Fuse from 'fuse.js';

// Default Fuse options (tunable by callers)
const DEFAULT_OPTIONS = {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    'name',
    'email',
    'phone',
    'address.street',
    'address.city',
    'address.state',
    'address.zip',
  ],
};

function createIndex(list = [], options = {}) {
  return new Fuse(list, { ...DEFAULT_OPTIONS, ...options });
}

function search(indexOrList, query, options = {}) {
  if (!query || !query.trim()) return [];
  // Accept either a prepared Fuse index or raw list
  let fuseInstance;
  if (indexOrList instanceof Fuse) {
    fuseInstance = indexOrList;
  } else if (Array.isArray(indexOrList)) {
    fuseInstance = createIndex(indexOrList, options);
  } else {
    return [];
  }
  return fuseInstance
    .search(query)
    .map((r) => ({ item: r.item, score: r.score }));
}

const SearchService = { createIndex, search, DEFAULT_OPTIONS };

// Maintain legacy global for backward compatibility
if (typeof window !== 'undefined') {
  window.NightingaleSearch = SearchService;
}

export { createIndex, search, DEFAULT_OPTIONS };
export default SearchService;
