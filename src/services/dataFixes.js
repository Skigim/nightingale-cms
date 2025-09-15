/**
 * dataFixes.js
 * One-time or ad-hoc data correction utilities that can be invoked manually.
 * These functions should be idempotent and safe to re-run.
 */

import { ensureStringId } from './nightingale.datamanagement.js';

/**
 * normalizeDataset
 * Consolidated normalization + legacy cleanup routine.
 * Goals:
 *  - Ensure every person has a stable name (prefer existing `name`, else compose from first/last, else 'Unknown Person').
 *  - Remove deprecated case.clientName when the referenced person is resolvable (case display layers derive dynamically).
 *  - Backfill case.personName (if it exists and differs) is ignored; we converge on live person lookup. We only keep case.clientName when orphaned.
 *  - Provide a detailed summary of changes for logging / UI feedback.
 * Behavior is idempotent.
 *
 * @param {Object} fullData - Current dataset object.
 * @param {Object} [fileService] - Optional file service with writeFile(updatedData).
 * @param {boolean} [persist=true] - Whether to persist when fileService present.
 * @returns {Promise<{changed:number, updatedData:Object, persisted:boolean, summary:Object}>}
 */
export async function normalizeDataset(fullData, fileService, persist = true) {
  if (!fullData || typeof fullData !== 'object') {
    return {
      changed: 0,
      updatedData: fullData,
      persisted: false,
      summary: { reason: 'invalid-input' },
    };
  }

  const original = fullData;
  const people = Array.isArray(original.people) ? original.people : [];
  const cases = Array.isArray(original.cases) ? original.cases : [];

  let peopleNameFixed = 0;
  const normalizedPeople = people.map((p) => {
    if (p && !p.name) {
      const composite = [p.firstName, p.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (composite) {
        peopleNameFixed += 1;
        return { ...p, name: composite };
      }
      peopleNameFixed += 1;
      return { ...p, name: 'Unknown Person' };
    }
    return p;
  });

  const peopleMap = new Map(
    normalizedPeople.map((p) => [
      ensureStringId(p.id),
      p.name || 'Unknown Person',
    ]),
  );

  let caseClientNameRemoved = 0;
  let orphanClientNamesRetained = 0;
  const normalizedCases = cases.map((c) => {
    if (!c) return c;
    if (c.clientName && c.personId) {
      const resolved = peopleMap.get(ensureStringId(c.personId));
      if (resolved) {
        // Safe to drop snapshot; UI derives live name
        caseClientNameRemoved += 1;
        const { clientName, ...rest } = c; // eslint-disable-line no-unused-vars
        return { ...rest };
      }
      orphanClientNamesRetained += 1; // Keep for historical display (person missing)
    }
    return c;
  });

  const changed = peopleNameFixed + caseClientNameRemoved > 0 ? 1 : 0; // flag if any mutation occurred
  if (!changed) {
    return {
      changed: 0,
      updatedData: original,
      persisted: false,
      summary: {
        peopleNameFixed: 0,
        caseClientNameRemoved: 0,
        orphanClientNamesRetained,
        message: 'No normalization changes required',
      },
    };
  }

  const updatedData = {
    ...original,
    people: normalizedPeople,
    cases: normalizedCases,
  };

  let persistedFlag = false;
  if (persist && fileService?.writeFile) {
    try {
      await fileService.writeFile(updatedData);
      persistedFlag = true;
    } catch (e) {
      persistedFlag = false; // Caller can decide to surface error
    }
  }

  return {
    changed: 1,
    updatedData,
    persisted: persistedFlag,
    summary: {
      peopleNameFixed,
      caseClientNameRemoved,
      orphanClientNamesRetained,
      message: 'Dataset normalized',
    },
  };
}

export default { normalizeDataset };
