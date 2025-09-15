#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
}

function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = pkg.version.replace(/^v/, '');

  // get nearest tag pointing at HEAD (exact match)
  let tag = '';
  try {
    tag = sh('git tag --points-at HEAD');
  } catch (e) {
    console.error('Failed to list tags for HEAD');
    process.exit(1);
  }

  const tags = tag.split(/\n/).filter(Boolean);
  // choose a tag that matches v<version>
  const expected = `v${version}`;
  const matched = tags.find((t) => t === expected);
  if (!matched) {
    console.error(
      `Version tag mismatch: expected tag '${expected}' pointing at HEAD. Found tags: ${tags.join(',') || '(none)'}`,
    );
    process.exit(2);
  }
  console.log(
    `Version tag verification passed: ${matched} matches package.json version ${version}`,
  );
}

main();
