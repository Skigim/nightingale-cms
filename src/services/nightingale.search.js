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

// Cache Fuse indices by list reference and options signature to avoid rebuilds
const _indexCache = new WeakMap(); // WeakMap<Array, Map<string, Fuse>>

function _getOptionsKey(options = {}) {
  // Stable stringify for options; keys order shouldn't matter much for our small shape
  // Merge with defaults so equivalent calls map to the same cache entry
  const merged = { ...DEFAULT_OPTIONS, ...options };
  return JSON.stringify(merged);
}

function _getCachedIndex(list, options = {}) {
  const key = _getOptionsKey(options);
  let perList = _indexCache.get(list);
  if (!perList) {
    perList = new Map();
    _indexCache.set(list, perList);
  }
  let idx = perList.get(key);
  if (!idx) {
    idx = new Fuse(list, { ...DEFAULT_OPTIONS, ...options });
    perList.set(key, idx);
  }
  return idx;
}

function createIndex(list = [], options = {}) {
  // Return a cached index for performance; callers that need a fresh index
  // for a mutated list should pass a new array reference or explicit option
  return _getCachedIndex(list, options);
}

function _getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function _linearScan(list, query, options = {}) {
  const keys = options.keys || DEFAULT_OPTIONS.keys;
  const q = query.toLowerCase();
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      const value = _getByPath(item, key);
      if (value == null) continue;
      if (String(value).toLowerCase().includes(q)) {
        out.push({ item, score: 0 });
        break;
      }
    }
  }
  return out;
}

function search(indexOrList, query, options = {}) {
  if (!query || !query.trim()) return [];
  const trimmed = query.trim();
  const minLen =
    options.minMatchCharLength ?? DEFAULT_OPTIONS.minMatchCharLength;
  if (trimmed.length < minLen) return [];
  // Accept either a prepared Fuse index or raw list
  let fuseInstance;
  if (indexOrList instanceof Fuse) {
    fuseInstance = indexOrList;
  } else if (Array.isArray(indexOrList)) {
    // Fast path: for plain substring queries, a linear scan is often faster than building a Fuse index once
    const forceFuse = options.forceFuse === true;
    if (!forceFuse) {
      return _linearScan(indexOrList, trimmed, options);
    }
    fuseInstance = _getCachedIndex(indexOrList, options);
  } else {
    return [];
  }
  return fuseInstance
    .search(trimmed)
    .map((r) => ({ item: r.item, score: r.score }));
}

const SearchService = { createIndex, search, DEFAULT_OPTIONS };

// Maintain legacy global for backward compatibility
if (typeof window !== 'undefined') {
  window.NightingaleSearch = SearchService;
}

export { createIndex, search, DEFAULT_OPTIONS };
export default SearchService;
