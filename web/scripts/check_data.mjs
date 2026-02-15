import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/data/kanji.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const must = ['id', 'gradeLabel', 'hanja', 'reading', 'meaning'];
let ok = true;

function fail(msg) {
  ok = false;
  console.error('✗', msg);
}

// counts by gradeLabel
const counts = new Map();

for (const [i, k] of data.entries()) {
  for (const key of must) {
    if (!k[key] || typeof k[key] !== 'string') fail(`missing ${key} at index ${i} (${k.id ?? 'no-id'})`);
  }

  counts.set(k.gradeLabel, (counts.get(k.gradeLabel) || 0) + 1);

  if (Array.isArray(k.confusables)) {
    const set = new Set();
    for (const c of k.confusables) {
      if (typeof c !== 'string' || !c) fail(`bad confusable at ${k.id}`);
      if (c === k.hanja) fail(`confusables contains itself at ${k.id}`);
      if (set.has(c)) fail(`duplicate confusable '${c}' at ${k.id}`);
      set.add(c);
    }
  }
}

const expected = {
  '8급': 50,
  '7급': 50,
  '7급Ⅱ': 50,
  '6급': 75,
  '6급Ⅱ': 75,
  '5급': 100,
  '4급': 250,
  '4급Ⅱ': 250,
};

for (const [label, n] of Object.entries(expected)) {
  const got = counts.get(label) || 0;
  if (got !== n) fail(`gradeLabel ${label} count expected ${n}, got ${got}`);
}

if (ok) {
  console.log('✓ data check OK');
  process.exit(0);
} else {
  process.exit(1);
}
