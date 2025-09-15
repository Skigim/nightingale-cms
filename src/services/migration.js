/**
 * migration.js
 * Legacy detection + full migration orchestration wrapper.
 * UI can call detectLegacyProfile() for a preview, then runFullMigration() to transform.
 */

import {
  normalizeDataMigrations,
  ensureStringId,
} from './nightingale.datamanagement.js';
import { normalizeDataset } from './dataFixes.js';

/**
 * Inspect a raw dataset and return legacy indicators.
 * @param {Object} data
 * @returns {{ isLegacy:boolean, indicators:Object, summary:string[] }}
 */
export function detectLegacyProfile(data) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return { isLegacy: false, indicators: {}, summary: [] };
  }

  const indicators = {
    hasMasterCaseNumber: false,
    numericIds: false,
    financialValueField: false,
    financialTypeWithoutDescription: false,
    missingMetadata: false,
    casePersonIdNumeric: false,
  };

  const summary = [];

  // masterCaseNumber detection
  if (Array.isArray(data.cases)) {
    indicators.hasMasterCaseNumber = data.cases.some(
      (c) => c && c.masterCaseNumber && !c.mcn,
    );
    if (indicators.hasMasterCaseNumber) summary.push('masterCaseNumber → mcn');

    indicators.casePersonIdNumeric = data.cases.some(
      (c) => c && typeof c.personId === 'number',
    );
    if (indicators.casePersonIdNumeric) summary.push('numeric case.personId');
  }

  // numeric IDs in people / cases / orgs
  const collections = [data.people, data.cases, data.organizations];
  indicators.numericIds = collections.some((col) =>
    Array.isArray(col)
      ? col.some((item) => item && typeof item.id === 'number')
      : false,
  );
  if (indicators.numericIds) summary.push('numeric ids');

  // financial legacy fields
  if (Array.isArray(data.cases)) {
    for (const c of data.cases) {
      const fin = c?.financials;
      if (!fin) continue;
      ['resources', 'income', 'expenses'].forEach((k) => {
        if (Array.isArray(fin[k])) {
          fin[k].forEach((item) => {
            if (item && item.value !== undefined && item.amount === undefined) {
              indicators.financialValueField = true;
            }
            if (item && item.type && !item.description) {
              indicators.financialTypeWithoutDescription = true;
            }
          });
        }
      });
    }
  }
  if (indicators.financialValueField) summary.push('financial value → amount');
  if (indicators.financialTypeWithoutDescription)
    summary.push('financial type → description');

  // metadata
  indicators.missingMetadata = !data.metadata || !data.metadata.schemaVersion;
  if (indicators.missingMetadata) summary.push('missing metadata');

  const isLegacy = Object.values(indicators).some((v) => v === true);

  return { isLegacy, indicators, summary };
}

/**
 * Run full migration pipeline (normalize + optional fixers) and produce a report.
 * @param {Object} rawData
 * @param {{ applyFixes?: boolean }} [options]
 * @returns {Promise<{ migratedData:Object, report:Object }>}
 */
export async function runFullMigration(rawData, options = {}) {
  const { applyFixes = true } = options;
  const before = rawData ? JSON.parse(JSON.stringify(rawData)) : rawData;
  const detection = detectLegacyProfile(before);

  const migratedData = await normalizeDataMigrations(before);

  let normalizationResult = { changed: 0, summary: {} };
  if (applyFixes) {
    normalizationResult = await normalizeDataset(migratedData, null, false);
    // Use potentially updated data (people/cases) after normalization step
    if (normalizationResult.changed) {
      Object.assign(migratedData, normalizationResult.updatedData);
    }
  }

  // orphan personId warnings
  let orphanCasePersonIds = [];
  if (Array.isArray(migratedData.cases)) {
    const personIds = new Set(
      (migratedData.people || []).map((p) => ensureStringId(p.id)),
    );
    orphanCasePersonIds = migratedData.cases
      .filter((c) => c.personId && !personIds.has(ensureStringId(c.personId)))
      .map((c) => ensureStringId(c.personId));
  }

  const report = {
    legacyDetected: detection.isLegacy,
    indicators: detection.indicators,
    appliedTransforms: detection.summary,
    counts: {
      before: {
        cases: before?.cases?.length || 0,
        people: before?.people?.length || 0,
        organizations: before?.organizations?.length || 0,
      },
      after: {
        cases: migratedData?.cases?.length || 0,
        people: migratedData?.people?.length || 0,
        organizations: migratedData?.organizations?.length || 0,
      },
    },
    fixes: {
      normalizationApplied: normalizationResult.changed === 1,
      peopleNameFixed: normalizationResult.summary?.peopleNameFixed || 0,
      caseClientNameRemoved:
        normalizationResult.summary?.caseClientNameRemoved || 0,
      orphanClientNamesRetained:
        normalizationResult.summary?.orphanClientNamesRetained || 0,
    },
    warnings: {
      orphanCasePersonIds: [...new Set(orphanCasePersonIds)],
    },
  };

  return { migratedData, report };
}

export default { detectLegacyProfile, runFullMigration };
