import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/data/kanji.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const must = ['id', 'gradeLabel', 'hanja', 'reading', 'meaning'];
const allHanja = new Set(data.map((k) => k.hanja));
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
    if (k.confusables.length > 8) fail(`too many confusables (${k.confusables.length}) at ${k.id}`);

    const set = new Set();
    for (const c of k.confusables) {
      if (typeof c !== 'string' || !c) fail(`bad confusable at ${k.id}`);
      if (c === k.hanja) fail(`confusables contains itself at ${k.id}`);
      if (!allHanja.has(c)) fail(`confusable '${c}' not found in dataset at ${k.id}`);
      if (set.has(c)) fail(`duplicate confusable '${c}' at ${k.id}`);
      set.add(c);
    }
  }

  if (k.exampleWord !== undefined) {
    if (typeof k.exampleWord !== 'string' || !k.exampleWord.trim()) fail(`bad exampleWord at ${k.id}`);
    if (k.exampleWord.trim().length > 10) fail(`exampleWord too long at ${k.id}`);
  }
  if (k.exampleMeaning !== undefined) {
    if (typeof k.exampleMeaning !== 'string' || !k.exampleMeaning.trim()) fail(`bad exampleMeaning at ${k.id}`);
    if (!k.exampleWord || !String(k.exampleWord).trim()) fail(`exampleMeaning without exampleWord at ${k.id}`);
    if (k.exampleMeaning.trim().length > 40) fail(`exampleMeaning too long at ${k.id}`);
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
