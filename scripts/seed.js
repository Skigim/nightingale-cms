#!/usr/bin/env node
/**
 * Data Seed Script for Nightingale CMS (ESM)
 * Reuses the shared generator for consistency.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSampleData } from '../src/services/sampleData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  const data = generateSampleData({
    organizations: 20,
    people: 100,
    cases: 50,
  });
  const outPath = path.join(__dirname, '..', 'Data', 'nightingale-data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(
    `Seed data generated: ${data.organizations.length} organizations, ${data.people.length} people, ${data.cases.length} cases -> ${outPath}`,
  );
}

main();
