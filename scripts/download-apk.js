#!/usr/bin/env node

const { execSync } = require('child_process');

const output = process.argv[2] || 'rune-wallet.apk';
const json = execSync(
  'npx eas build:list -p android --status finished --limit 1 --json --non-interactive',
  { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
);
const build = JSON.parse(json)[0];

if (!build) {
  console.error('Nessun build Android completato. Prima: npm run build:apk -- --wait');
  process.exit(1);
}

const url = build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl;
if (!url) {
  console.error(`Build ${build.id} senza APK.`);
  process.exit(1);
}

console.log(`Scarico build ${build.id}...`);
execSync(`curl -fsSL -o "${output}" "${url}"`, { stdio: 'inherit' });
console.log(`Salvato: ${output}`);
