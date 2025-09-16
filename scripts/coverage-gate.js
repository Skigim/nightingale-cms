#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { execSync } = require('node:child_process');

const THRESHOLD_STEP = 2.0; // require at least this much improvement or no regression
const METRICS = ['statements', 'branches', 'functions', 'lines'];

function readJSON(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function loadCurrent() {
  // Prefer summarized totals for accuracy
  const summaryPath = 'coverage/coverage-summary.json';
  if (!fs.existsSync(summaryPath)) {
    // Attempt automatic coverage generation fallback
    try {
      console.log(
        '[coverage-gate] coverage-summary.json missing – attempting to run Jest to generate it...',
      );
      // Run jest in a child process synchronously
      execSync(
        'npx jest --coverage --coverageReporters=json-summary --coverageReporters=text-summary --silent',
        {
          stdio: 'inherit',
        },
      );
    } catch (err) {
      throw new Error(
        'coverage-summary.json not found and auto-generation failed: ' +
          (err?.message || err),
      );
    }
    if (!fs.existsSync(summaryPath)) {
      throw new Error(
        'coverage-summary.json still missing after attempted generation.',
      );
    }
  }
  const summary = readJSON(summaryPath);
  if (!summary.total)
    throw new Error('Invalid coverage-summary.json: missing total key');
  const { total } = summary;
  const map = {
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct,
  };
  // Normalize to two decimals
  for (const k of Object.keys(map)) map[k] = +map[k].toFixed(2);
  return map;
}

function main() {
  const baseline = readJSON('coverage-baseline.json');
  const current = loadCurrent();

  console.log('Coverage baseline:', baseline);
  console.log('Coverage current :', current);

  let fail = false;
  const report = [];

  for (const m of METRICS) {
    const prev = baseline[m];
    const now = current[m];
    const delta = +(now - prev).toFixed(2);
    if (delta < 0) {
      fail = true;
      report.push(`REGRESSION ${m}: ${prev}% -> ${now}% (delta ${delta}%)`);
    } else if (delta >= THRESHOLD_STEP) {
      report.push(`IMPROVED ${m}: ${prev}% -> ${now}% (delta +${delta}%)`);
    } else {
      report.push(`STABLE ${m}: ${prev}% -> ${now}% (delta +${delta}%)`);
    }
  }

  console.log(report.join('\n'));

  if (fail) {
    console.error('Coverage gate failed due to regression.');
    process.exit(2);
  }

  // Optionally auto-bump baseline when all metrics improved or stable without regression
  if (!fail) {
    const newBaseline = {
      ...baseline,
      ...current,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(
      'coverage-baseline.json',
      JSON.stringify(newBaseline, null, 2),
    );
    console.log('Baseline updated.');
  }
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
