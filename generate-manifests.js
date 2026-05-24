#!/usr/bin/env node
/**
 * generate-manifests.js
 * Scans data directories and writes manifest.json files listing all .json files 
 * so the frontend knows what to fetch dynamically.
 */

const fs   = require('fs');
const path = require('path');

function generateManifest(dir) {
  const fullDir = path.join(__dirname, dir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
  const files = fs.readdirSync(fullDir)
    .filter(f => f.endsWith('.json') && f !== 'manifest.json')
    .sort(); // stable order
  const manifest = { files };
  fs.writeFileSync(
    path.join(fullDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`[manifest] ${dir}: ${files.length} file(s) -> manifest.json`);
}

generateManifest('data/projects');
generateManifest('data/certificates');
generateManifest('data/experience');
generateManifest('data/skills');
generateManifest('data/blogs');
generateManifest('data/profile');

console.log('[manifest] Done.');
