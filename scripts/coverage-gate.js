#!/usr/bin/env node
import fs from 'node:fs';

const THRESHOLD_STEP = 2.0; // require at least this much improvement or no regression
const METRICS = ['statements', 'branches', 'functions', 'lines'];

function readJSON(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function loadCurrent() {
  // Jest writes coverage/coverage-final.json; we compute overall from that file's totals
  const cov = readJSON('coverage/coverage-final.json');
  const totals = { statements: 0, branches: 0, functions: 0, lines: 0 };
  let files = 0;
  for (const file of Object.keys(cov)) {
    const data = cov[file];
    if (!data) continue;
    totals.statements += data.s.total ? data.s.covered / data.s.total : 0;
    totals.branches += data.b.total ? data.b.covered / data.b.total : 0;
    totals.functions += data.f.total ? data.f.covered / data.f.total : 0;
    totals.lines += data.l.total ? data.l.covered / data.l.total : 0;
    files++;
  }
  if (files === 0) throw new Error('No files found in coverage-final.json');
  for (const k of Object.keys(totals)) {
    totals[k] = +((totals[k] / files) * 100).toFixed(2);
  }
  return totals;
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
