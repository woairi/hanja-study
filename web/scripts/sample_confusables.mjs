import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('src/data/kanji.json', 'utf8'));
const set = new Set(data.map((k) => k.hanja));

const rows = data
  .filter((k) => Array.isArray(k.confusables) && k.confusables.length)
  .map((k) => ({
    id: k.id,
    grade: k.gradeLabel,
    hanja: k.hanja,
    len: k.confusables.length,
    missing: k.confusables.filter((c) => !set.has(c)),
  }))
  .sort((a, b) => b.len - a.len);

console.log('confusables items:', rows.length);
console.log('missing refs count:', rows.filter((r) => r.missing.length).length);
console.log('\nTop 25 by confusables length:');
for (const r of rows.slice(0, 25)) {
  console.log(`${r.grade} ${r.hanja} (${r.id}) len=${r.len}${r.missing.length ? ` missing=[${r.missing.join(',')}]` : ''}`);
}

console.log('\nSample 30:');
const sample = [];
let seed = 1337;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
for (let i = 0; i < 30 && rows.length; i++) {
  sample.push(rows[Math.floor(rnd() * rows.length)]);
}
for (const r of sample) {
  console.log(`${r.grade} ${r.hanja} len=${r.len} → ${data.find((k) => k.id === r.id).confusables.join(' ')}`);
}
