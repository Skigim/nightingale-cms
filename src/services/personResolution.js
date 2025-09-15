/**
 * personResolution.js
 * Shared utility for resolving person objects and display names consistently across UI/business components.
 * Avoids duplicated lookup/matching logic and ensures consistent fallbacks.
 */
import {
  findPersonById,
  ensureStringId,
} from './nightingale.datamanagement.js';

/**
 * Build an index of people keyed by common variant forms of the id to accelerate resolution.
 * @param {Array} people
 * @returns {Map<string, object>} index
 */
export function buildPeopleIndex(people) {
  const idx = new Map();
  if (!Array.isArray(people)) return idx;
  people.forEach((p) => {
    if (!p) return;
    const id = ensureStringId(p.id);
    if (!id) return;
    const noZeros = id.replace(/^0+/, '') || id;
    const variants = new Set([
      id,
      id.padStart(2, '0'),
      noZeros,
      noZeros.padStart(2, '0'),
    ]);
    const numericVal = Number(noZeros);
    if (!Number.isNaN(numericVal)) {
      variants.add(String(numericVal));
    }
    variants.forEach((v) => {
      if (v && !idx.has(v)) idx.set(v, p);
    });
  });
  return idx;
}

/**
 * Resolve a person by id using the index first; falls back to findPersonById for completeness.
 * @param {Map} index
 * @param {Array} people
 * @param {string|number} personId
 * @returns {object|null}
 */
export function resolvePerson(index, people, personId) {
  if (!personId) return null;
  const key = ensureStringId(personId);
  if (index?.has(key)) return index.get(key);
  const noZeros = key.replace(/^0+/, '') || key;
  if (index?.has(noZeros)) return index.get(noZeros);
  const numericVal = Number(noZeros);
  if (!Number.isNaN(numericVal)) {
    const numeric = String(numericVal);
    if (index?.has(numeric)) return index.get(numeric);
  }
  // Fallback to full scan logic (handles zero-width & other normalization from service)
  return findPersonById(people, personId) || null;
}

/**
 * Derive a consistent display name with distinct states for loading vs missing vs no assignment.
 * @param {object|null} person Resolved person object
 * @param {object} caseItem Case record (may contain clientName)
 * @param {boolean} peopleLoaded Whether people array has finished loading (non-null / not pending)
 * @param {boolean} hasPeople Whether we actually have people records
 * @returns {string}
 */
export function derivePersonName(person, caseItem, peopleLoaded, hasPeople) {
  // No person assigned to the case
  if (!caseItem?.personId) return 'No Person Assigned';
  // People not yet loaded but we expect them
  if (!peopleLoaded) return '(loading…)';
  // People loaded but empty list
  if (peopleLoaded && !hasPeople) return 'Unlinked Person';
  if (!person) return 'Unlinked Person';
  const composite = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(' ');
  return person.name || composite || caseItem?.clientName || 'Unlinked Person';
}

export default {
  buildPeopleIndex,
  resolvePerson,
  derivePersonName,
};
