// formatters.js - Input formatting helpers (idempotent, partial tolerant)
// Keep purely functional; no DOM / side effects.

// Format US SSN as XXX-XX-XXXX while typing.
// Accepts partial input; strips non-digits first.
export function formatSSN(value) {
  if (!value) return '';
  const digits = value.replace(/[^0-9]/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

// Normalize to digit-only for validation/storage if needed.
export function unformatSSN(value) {
  return value ? value.replace(/[^0-9]/g, '').slice(0, 9) : '';
}

// Format US phone number progressively: (XXX) YYY-ZZZZ
// Falls back gracefully for < 4 and < 7 digit states.
export function formatUSPhone(value) {
  if (!value) return '';
  const digits = value.replace(/[^0-9]/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function unformatPhone(value) {
  return value ? value.replace(/[^0-9]/g, '').slice(0, 10) : '';
}

export default {
  formatSSN,
  unformatSSN,
  formatUSPhone,
  unformatPhone,
};
