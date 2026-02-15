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
    if (!Array.isArray(k.confusables) || k.confusables.length < 5) continue;
    if (!(k.gradeLabel === '4급' || k.gradeLabel === '4급Ⅱ')) continue;

    const orig = k.confusables;
    const keep = [];
    for (const c of orig) {
      const ck = byHanja.get(c);
      if (!ck) continue;

      const sameReading = ck.reading === k.reading;
      const sameRadical = !!ck.radical && !!k.radical && ck.radical === k.radical;
      const s1 = typeof ck.totalStrokes === 'number' ? ck.totalStrokes : null;
      const s2 = typeof k.totalStrokes === 'number' ? k.totalStrokes : null;
      const strokeDiff = s1 !== null && s2 !== null ? Math.abs(s1 - s2) : null;
      const strokeClose = strokeDiff !== null ? strokeDiff <= 2 : false;
      const strokeNotCrazy = strokeDiff !== null ? strokeDiff <= 5 : false;

      // We want VISUAL confusables, not just homophones.
      // Keep if radicals match, or strokes are close, or (same reading AND strokes not crazy).
      if (sameRadical || strokeClose || (sameReading && strokeNotCrazy)) keep.push(c);
    }

    // prune only if it meaningfully removes noise
    if (keep.length >= 2 && keep.length < orig.length) {
      // but avoid over-pruning: only apply if >=40% removed
      const removedRatio = (orig.length - keep.length) / orig.length;
      if (removedRatio >= 0.4) {
        k.confusables = keep;
        changed++;
      }
    }
  }

  saveJson(file, data);
  console.log(file, 'confusables-pruned-items', changed);
}
