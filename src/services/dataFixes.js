/**
 * dataFixes.js
 * One-time or ad-hoc data correction utilities that can be invoked manually.
 * These functions should be idempotent and safe to re-run.
 */

import { ensureStringId } from './nightingale.datamanagement.js';

/**
 * Backfill missing case.clientName values using linked person records.
 * Does not mutate the original dataset; returns a new object if changes occur.
 * Optionally persists via provided fileService.writeFile.
 *
 * @param {Object} fullData - Current dataset
 * @param {Object} [fileService] - Optional file service with writeFile(updatedData)
 * @param {boolean} [persist=true] - Whether to persist when fileService present
 * @returns {Promise<{changed:number, updatedData:Object, persisted:boolean}>}
 */
export async function backfillClientNames(
  fullData,
  fileService,
  persist = true,
) {
  if (!fullData || typeof fullData !== 'object') {
    return { changed: 0, updatedData: fullData, persisted: false };
  }

  const people = Array.isArray(fullData.people) ? fullData.people : [];
  const peopleMap = new Map(
    people.map((p) => {
      const composite = [p.firstName, p.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const name = p.name || composite || null;
      return [ensureStringId(p.id), name];
    }),
  );

  if (!Array.isArray(fullData.cases) || fullData.cases.length === 0) {
    return { changed: 0, updatedData: fullData, persisted: false };
  }

  let changed = 0;
  const updatedCases = fullData.cases.map((c) => {
    if (c && !c.clientName && c.personId) {
      const key = ensureStringId(c.personId);
      const derived = peopleMap.get(key);
      if (derived) {
        changed += 1;
        return { ...c, clientName: derived };
      }
    }
    return c;
  });

  if (changed === 0) {
    return { changed, updatedData: fullData, persisted: false };
  }

  const updatedData = { ...fullData, cases: updatedCases };
  let persistedFlag = false;
  if (persist && fileService?.writeFile) {
    try {
      await fileService.writeFile(updatedData);
      persistedFlag = true;
    } catch (e) {
      // Swallow error; caller can decide to surface via toast
      persistedFlag = false;
    }
  }
  return { changed, updatedData, persisted: persistedFlag };
}

export default { backfillClientNames };
