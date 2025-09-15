#!/usr/bin/env node
/**
 * Data Integrity Report Script
 *
 * Scans a Nightingale CMS data JSON file (default: Data/nightingale-data.json) and reports:
 *  - Orphan cases (case.personId not found in people array)
 *  - Orphan spouse references
 *  - Authorized rep IDs not found
 *  - Duplicate person IDs / case IDs
 *  - Counts summary
 *
 * Usage:
 *   node scripts/data-integrity-report.js [path/to/data.json]
 *
 * Exit codes:
 *   0 = success (no critical integrity issues)
 *   1 = file not found / parse error
 *   2 = integrity warnings detected (orphans / duplicates)
 */
import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2] || 'Data/nightingale-data.json';

function loadJson(p) {
  const abs = path.resolve(process.cwd(), p);
  if (!fs.existsSync(abs)) {
    console.error('[integrity] File not found:', abs);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(abs, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[integrity] Failed to parse JSON:', err.message);
    process.exit(1);
  }
}

function uniq(arr) {
  return [...new Set(arr)];
}

function analyze(data) {
  const people = Array.isArray(data.people) ? data.people : [];
  const cases = Array.isArray(data.cases) ? data.cases : [];

  const peopleIds = new Set(people.map((p) => String(p.id)));
  const caseIds = new Set();
  const duplicateCaseIds = [];
  const duplicatePersonIds = people
    .map((p) => p.id)
    .filter((id, idx, arr) => arr.indexOf(id) !== idx)
    .filter((v, i, a) => a.indexOf(v) === i);

  const orphanCases = [];
  const spouseOrphans = [];
  const orphanAuthorizedReps = [];

  for (const c of cases) {
    if (caseIds.has(c.id)) duplicateCaseIds.push(c.id);
    else caseIds.add(c.id);
    if (c.personId && !peopleIds.has(String(c.personId))) {
      orphanCases.push({ caseId: c.id, personId: c.personId });
    }
    if (c.spouseId && !peopleIds.has(String(c.spouseId))) {
      spouseOrphans.push({ caseId: c.id, spouseId: c.spouseId });
    }
    if (Array.isArray(c.authorizedReps)) {
      for (const repId of c.authorizedReps) {
        if (!peopleIds.has(String(repId))) {
          orphanAuthorizedReps.push({ caseId: c.id, repId });
        }
      }
    }
  }

  return {
    summary: {
      peopleCount: people.length,
      caseCount: cases.length,
      duplicatePersonIds: duplicatePersonIds.length,
      duplicateCaseIds: duplicateCaseIds.length,
      orphanCases: orphanCases.length,
      spouseOrphans: spouseOrphans.length,
      orphanAuthorizedReps: orphanAuthorizedReps.length,
    },
    details: {
      duplicatePersonIds,
      duplicateCaseIds: uniq(duplicateCaseIds),
      orphanCases,
      spouseOrphans,
      orphanAuthorizedReps,
    },
  };
}

function main() {
  const data = loadJson(inputPath);
  const report = analyze(data);

  console.log('=== Nightingale Data Integrity Report ===');
  console.log('File:', inputPath);
  console.table(report.summary);

  const { details } = report;
  const hasIssues = Object.values(report.summary).some(
    (v, idx) => idx >= 2 && v > 0,
  );

  if (details.orphanCases.length) {
    console.log('\nOrphan Cases (personId missing):');
    console.table(details.orphanCases.slice(0, 25));
    if (details.orphanCases.length > 25)
      console.log(`... ${details.orphanCases.length - 25} more`);
  }
  if (details.spouseOrphans.length) {
    console.log('\nSpouse Orphans (spouseId missing):');
    console.table(details.spouseOrphans.slice(0, 25));
  }
  if (details.orphanAuthorizedReps.length) {
    console.log('\nOrphan Authorized Reps:');
    console.table(details.orphanAuthorizedReps.slice(0, 25));
  }
  if (details.duplicatePersonIds.length) {
    console.log('\nDuplicate Person IDs:');
    console.log(details.duplicatePersonIds.join(', '));
  }
  if (details.duplicateCaseIds.length) {
    console.log('\nDuplicate Case IDs:');
    console.log(details.duplicateCaseIds.join(', '));
  }

  if (hasIssues) {
    console.log('\n[integrity] Issues detected. Exit code 2.');
    process.exit(2);
  } else {
    console.log('\n[integrity] No critical issues detected.');
  }
}

main();
