// settings.js - lightweight persisted user settings
// Uses localStorage; no external dependencies. Defensive for SSR/tests.

const STORAGE_KEY = 'nightingale:settings:v1';

const defaultSettings = {
  strictValidation: false, // When true, creation modals require fields to proceed
};

function loadRaw() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function saveRaw(obj) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (_) {
    // ignore persistence errors (quota, etc.)
  }
}

export function getSettings() {
  const stored = loadRaw();
  return { ...defaultSettings, ...(stored || {}) };
}

export function updateSettings(patch) {
  const current = getSettings();
  const next = { ...current, ...patch };
  saveRaw(next);
  return next;
}

export function getStrictValidationEnabled() {
  return !!getSettings().strictValidation;
}

export function setStrictValidationEnabled(value) {
  return updateSettings({ strictValidation: !!value });
}

// Provide a simple event subscription (in-memory only) for UI reactivity.
const listeners = new Set();
export function subscribeSettings(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const snapshot = getSettings();
  listeners.forEach((l) => {
    try {
      l(snapshot);
    } catch (_) {
      /* ignore */
    }
  });
}

// Wrap setter to notify
export function toggleStrictValidation() {
  const current = getStrictValidationEnabled();
  setStrictValidationEnabled(!current);
  notify();
  return !current;
}

// Override updateSettings to notify (optional re-export pattern)
export function writeSettings(patch) {
  const next = updateSettings(patch);
  notify();
  return next;
}

export default {
  getSettings,
  updateSettings: writeSettings,
  getStrictValidationEnabled,
  setStrictValidationEnabled,
  toggleStrictValidation,
  subscribeSettings,
};
