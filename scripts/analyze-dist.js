#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const cwd = process.cwd();
const dist = path.join(cwd, 'dist');
if (!fs.existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

let totalRaw = 0;
let totalGzip = 0;

function shouldGzip(file) {
  return /\.(js|css|html|svg|json)$/.test(file);
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else {
      const rel = full.replace(cwd + path.sep, '');
      const buf = fs.readFileSync(full);
      const raw = buf.byteLength;
      totalRaw += raw;
      let gz = 0;
      if (shouldGzip(full)) {
        try {
          gz = zlib.gzipSync(buf, {
            level: zlib.constants.Z_BEST_COMPRESSION,
          }).byteLength;
          totalGzip += gz;
        } catch (_) {
          // fallback: ignore gzip if compression fails
        }
      }
      const suffix = gz ? `(gzip: ${formatKB(gz)})` : '';
      console.log(rel, '-', formatKB(raw), suffix);
    }
  }
}

walk(dist);
console.log(`\nTotal bundle size (raw): ${formatKB(totalRaw)}`);
if (totalGzip > 0)
  console.log(`Total bundle size (gzip est): ${formatKB(totalGzip)}`);

const maxRawKB = parseFloat(process.env.MAX_BUNDLE_KB || '');
const maxGzipKB = parseFloat(process.env.MAX_BUNDLE_GZIP_KB || '');

let violated = false;
if (!Number.isNaN(maxRawKB)) {
  const totalRawKB = totalRaw / 1024;
  if (totalRawKB > maxRawKB) {
    console.error(
      `\nERROR: Raw size ${totalRawKB.toFixed(2)} KB exceeds budget ${maxRawKB} KB.`,
    );
    violated = true;
  }
}
if (!Number.isNaN(maxGzipKB) && totalGzip > 0) {
  const totalGzipKB = totalGzip / 1024;
  if (totalGzipKB > maxGzipKB) {
    console.error(
      `\nERROR: Gzip size ${totalGzipKB.toFixed(2)} KB exceeds budget ${maxGzipKB} KB.`,
    );
    violated = true;
  }
}

if (violated) process.exit(2);
