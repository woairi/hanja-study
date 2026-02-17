#!/usr/bin/env node

import { execSync } from 'node:child_process';

const steps = [
  { name: 'lint', cmd: 'npm run lint' },
  { name: 'unit tests', cmd: 'npm test' },
  { name: 'top5 selectors', cmd: 'npm run check:top5' },
  { name: 'data checks', cmd: 'npm run check:data' },
  { name: 'build SW', cmd: 'node scripts/build-sw.mjs' },
  { name: 'build', cmd: 'npm run build' },
];

for (const s of steps) {
  process.stdout.write(`\n==> ${s.name}\n`);
  execSync(s.cmd, { stdio: 'inherit' });
}

process.stdout.write('\n✅ predeploy checks passed\n');
