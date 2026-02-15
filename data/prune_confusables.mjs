import fs from 'node:fs';

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
}

const files = ['data/kanji_8_to_5.json', 'web/src/data/kanji.json'];

for (const file of files) {
  const data = loadJson(file);
  const byHanja = new Map(data.map((k) => [k.hanja, k]));
  let changed = 0;

  for (const k of data) {
    if (!Array.isArray(k.confusables) || k.confusables.length < 1) continue;
    if (!(k.gradeLabel === '4급' || k.gradeLabel === '4급Ⅱ')) continue;

    const orig = k.confusables;

    function scoreCandidate(c) {
      const ck = byHanja.get(c);
      if (!ck) return -999;

      const sameReading = ck.reading === k.reading;
      const sameRadical = !!ck.radical && !!k.radical && ck.radical === k.radical;
      const s1 = typeof ck.totalStrokes === 'number' ? ck.totalStrokes : null;
      const s2 = typeof k.totalStrokes === 'number' ? k.totalStrokes : null;
      const strokeDiff = s1 !== null && s2 !== null ? Math.abs(s1 - s2) : null;

      // Higher is better. Prefer visual similarity.
      let s = 0;
      if (sameRadical) s += 3;
      if (strokeDiff !== null) {
        if (strokeDiff <= 1) s += 3;
        else if (strokeDiff <= 2) s += 2;
        else if (strokeDiff <= 3) s += 1;
        else if (strokeDiff >= 6) s -= 2;
      }
      if (sameReading) s += 1;
      return s;
    }

    // 1) Remove very low-similarity candidates
    const filtered = orig
      .map((c) => ({ c, s: scoreCandidate(c) }))
      .filter((x) => x.s >= 1) // require at least some similarity
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);

    // 2) Cap count to avoid noisy trap questions
    const capped = filtered.slice(0, 4);

    // apply if changed (or if we reduced noise)
    const next = capped.length >= 2 ? capped : orig.slice(0, Math.min(orig.length, 4));
    const same = next.length === orig.length && next.every((v, i) => v === orig[i]);
    if (!same) {
      k.confusables = next;
      changed++;
    }
  }

  saveJson(file, data);
  console.log(file, 'confusables-pruned-items', changed);
}
