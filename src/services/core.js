// Nightingale Core Utilities - Clean ES Module (v3.0.0-esm)
// Single authoritative implementation (previous legacy blocks removed)

// ---- Registries ----
const UIRegistry = Object.create(null);
const BusinessRegistry = Object.create(null);
export function registerComponent(registryName, componentName, component) {
  if (!componentName || typeof componentName !== 'string') return;
  const target = registryName === 'business' ? BusinessRegistry : UIRegistry;
  if (component) target[componentName] = component;
}
export function getComponent(registryName, componentName) {
  const target = registryName === 'business' ? BusinessRegistry : UIRegistry;
  return target[componentName];
}
export function listComponents(registryName) {
  const target = registryName === 'business' ? BusinessRegistry : UIRegistry;
  return Object.keys(target).sort();
}

// ---- Security & Sanitization ----
export function sanitize(str) {
  if (!str) return '';
  return str
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
export function setSanitizedInnerHTML(element, htmlString) {
  if (!element || typeof htmlString !== 'string') return;
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  element.innerHTML = '';
  Array.from(doc.body.childNodes).forEach((n) => element.appendChild(n));
}
export function encodeURL(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return encodeURIComponent(String(value));
}
export function sanitizeHTML(htmlString) {
  if (typeof htmlString !== 'string') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return doc.body.innerHTML;
}

// ---- Date / Time ----
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const adj = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return adj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
export function toInputDateFormat(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const adj = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return adj.toISOString().substring(0, 10);
}

// ---- Text Formatting ----
export function formatPhoneNumber(value) {
  if (!value) return '';
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}
export function formatProperCase(name) {
  if (!name || typeof name !== 'string') return '';
  let processed = name.trim();
  if (processed.includes(',')) {
    const parts = processed.split(',').map((p) => p.trim());
    processed = `${parts[1] || ''} ${parts[0] || ''}`.trim();
  }
  return processed
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
export function formatPersonName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (trimmed.includes(',')) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return trimmed;
  const last = parts[parts.length - 1];
  const firstMiddle = parts.slice(0, -1).join(' ');
  return `${last}, ${firstMiddle}`;
}

// ---- Validation ----
export const Validators = {
  required:
    (message = 'This field is required.') =>
    (value) => ({
      isValid: value != null && value.toString().trim() !== '',
      message,
      sanitizedValue: value != null ? value.toString().trim() : '',
    }),
  email:
    (message = 'Please enter a valid email address.') =>
    (value) => ({
      isValid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
      message,
      sanitizedValue: value ? value.toString().trim().toLowerCase() : '',
    }),
  phone:
    (message = 'Please enter a valid phone number.') =>
    (value) => {
      const cleaned = value ? value.replace(/\D/g, '') : '';
      return {
        isValid: !value || /(\d{10,})/.test(cleaned),
        message,
        sanitizedValue: cleaned,
      };
    },
  mcn:
    (message = 'Please enter a valid Master Case Number.') =>
    (value) => {
      const cleaned = value ? value.toString().trim().toUpperCase() : '';
      return {
        isValid: !value || /^[A-Z0-9\-_]{3,}$/.test(cleaned),
        message,
        sanitizedValue: cleaned,
      };
    },
  minLength:
    (len, message = `Must be at least ${len} characters.`) =>
    (value) => ({
      isValid: !value || value.trim().length >= len,
      message,
      sanitizedValue: value.trim(),
    }),
  maxLength:
    (len, message = `Must be no more than ${len} characters.`) =>
    (value) => ({
      isValid: !value || value.trim().length <= len,
      message,
      sanitizedValue: value.trim(),
    }),
};

// ---- Generic Data Utilities ----
export function getNextId(items) {
  if (!items || items.length === 0) return 1;
  return Math.max(1, ...items.map((i) => i.id || 0)) + 1;
}

// ---- Search Service (legacy-compatible, uses global Fuse if present) ----
class SearchServiceWrapper {
  constructor(data = [], options = {}) {
    const FuseRef =
      (typeof globalThis !== 'undefined' && globalThis.Fuse) || null;
    const defaultOptions = {
      includeScore: false,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
      ...options,
    };
    this.options = defaultOptions;
    this.data = Array.isArray(data) ? data : [];
    try {
      this.fuse = FuseRef ? new FuseRef(this.data, this.options) : null;
    } catch (_) {
      this.fuse = null;
    }
  }
  search(query) {
    if (!this.fuse || !query || typeof query !== 'string') return [];
    try {
      return this.fuse.search(query.trim()).map((r) => r.item || r);
    } catch {
      return [];
    }
  }
  setData(newData) {
    if (!Array.isArray(newData)) return;
    this.data = newData;
    if (this.fuse && this.fuse.setCollection) this.fuse.setCollection(newData);
  }
  isReady() {
    return !!this.fuse;
  }
}

// ---- Aggregate Export Object ----
const NightingaleCoreUtilities = {
  sanitize,
  setSanitizedInnerHTML,
  encodeURL,
  sanitizeHTML,
  formatDate,
  toInputDateFormat,
  formatPhoneNumber,
  formatProperCase,
  formatPersonName,
  Validators,
  getNextId,
  SearchService: SearchServiceWrapper,
  registerComponent,
  getComponent,
  listComponents,
  version: '3.0.0-esm',
};

export default NightingaleCoreUtilities;

// ---- Backward Compatibility Globals ----
if (typeof window !== 'undefined') {
  window.NightingaleCoreUtilities = NightingaleCoreUtilities;
  window.NightingaleSearchService = SearchServiceWrapper;
  window.sanitize = sanitize;
  window.setSanitizedInnerHTML = setSanitizedInnerHTML;
  window.encodeURL = encodeURL;
  window.sanitizeHTML = sanitizeHTML;
  window.formatDate = formatDate;
  window.toInputDateFormat = toInputDateFormat;
  window.formatPhoneNumber = formatPhoneNumber;
  window.formatProperCase = formatProperCase;
  window.formatPersonName = formatPersonName;
  window.Validators = Validators;
  window.getNextId = getNextId;
}
