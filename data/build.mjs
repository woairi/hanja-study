import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, v) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
}

function sha256FileHex(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function isoFromSourceDateEpoch() {
  const v = process.env.SOURCE_DATE_EPOCH;
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  // SOURCE_DATE_EPOCH is seconds since epoch
  return new Date(n * 1000).toISOString();
}

function normalizeMeaning(s) {
  return String(s)
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/→.*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickExampleWordFromMeaning(meaning) {
  const m = normalizeMeaning(meaning);
  const head = m.split(/\s*[\/·,;]|\s+또는\s+|\s+및\s+|\s+등\s+/)[0].trim();
  const compact = head.replace(/\s+/g, '');
  if (compact.length >= 1 && compact.length <= 10) return compact;
  if (head.length >= 1 && head.length <= 10) return head;
  return null;
}

function scoreConfusable(k, ck) {
  const sameReading = ck.reading === k.reading;
  const sameRadical = !!ck.radical && !!k.radical && ck.radical === k.radical;
  const s1 = typeof ck.totalStrokes === 'number' ? ck.totalStrokes : null;
  const s2 = typeof k.totalStrokes === 'number' ? k.totalStrokes : null;
  const strokeDiff = s1 !== null && s2 !== null ? Math.abs(s1 - s2) : null;

  // Higher is better. Prefer visual similarity.
  // Homophones alone are too noisy for trap questions.
  let s = 0;
  if (sameRadical) s += 3;
  if (strokeDiff !== null) {
    if (strokeDiff <= 1) s += 3;
    else if (strokeDiff <= 2) s += 2;
    else if (strokeDiff <= 3) s += 1;
    else if (strokeDiff <= 4) s += 0;
    else s -= 2;
  }
  // Only count same-reading when it still looks plausibly similar.
  if (sameReading && (sameRadical || (strokeDiff !== null && strokeDiff <= 3))) s += 1;
  return s;
}

const basePath = process.argv[2] || 'data/kanji_8_to_5.json';
const outDataPath = process.argv[3] || 'data/kanji_8_to_5.json';
const outWebPath = process.argv[4] || 'web/src/data/kanji.json';

// Manifest config
const DATASET_VERSION = process.env.DATASET_VERSION || '0.1.0';
const SCHEMA_VERSION = 1;

const base = loadJson(basePath);

function normalizeExamplesOverrides(raw) {
  if (Array.isArray(raw)) {
    const map = {};
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      if (typeof r.target !== 'string') continue;
      map[r.target] = {
        exampleWord: typeof r.exampleWord === 'string' ? r.exampleWord : '',
        exampleMeaning: typeof r.exampleMeaning === 'string' ? r.exampleMeaning : '',
      };
    }
    return map;
  }
  return raw && typeof raw === 'object' ? raw : {};
}

function normalizeConfOverrides(raw) {
  if (Array.isArray(raw)) {
    const map = {};
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      if (typeof r.target !== 'string') continue;
      map[r.target] = Array.isArray(r.confusables) ? r.confusables : [];
    }
    return map;
  }
  return raw && typeof raw === 'object' ? raw : {};
}

function normalizeBlockOverrides(raw) {
  return raw && typeof raw === 'object' ? raw : {};
}

const examples = normalizeExamplesOverrides(loadJson('data/examples_overrides.json').overrides || {});
const confOverrides = normalizeConfOverrides(loadJson('data/confusables_overrides.json').overrides || {});
const confBlock = normalizeBlockOverrides(loadJson('data/confusables_blocklist.json').overrides || {});

// Build lookups
const byHanja = new Map(base.map((k) => [k.hanja, k]));
const byGrade = new Map();
for (const k of base) {
  const arr = byGrade.get(k.gradeLabel) || [];
  arr.push(k);
  byGrade.set(k.gradeLabel, arr);
}

const enriched = base.map((k) => {
  const pool = byGrade.get(k.gradeLabel) || [];

  // confusables: overrides + heuristic same-reading candidates, then score/filter/cap
  const cand = new Set();
  const fromOv = confOverrides[k.hanja];
  if (Array.isArray(fromOv)) {
    for (const c of fromOv) {
      const ck = byHanja.get(c);
      if (!ck) continue;
      // Keep trap candidates inside the same grade pool.
      if (ck.gradeLabel !== k.gradeLabel) continue;
      cand.add(c);
    }
  }

  // heuristic 1: same reading within grade
  for (const x of pool) {
    if (x.hanja === k.hanja) continue;
    if (x.reading !== k.reading) continue;
    cand.add(x.hanja);
  }

  // heuristic 2: same radical within grade (visual similarity cue)
  if (k.radical) {
    for (const x of pool) {
      if (x.hanja === k.hanja) continue;
      if (!x.radical) continue;
      if (x.radical !== k.radical) continue;
      cand.add(x.hanja);
    }
  }

  const blocked = new Set(Array.isArray(confBlock[k.hanja]) ? confBlock[k.hanja] : []);

  // Override 항목은 점수 필터 없이 우선 포함
  const overrideCands = new Set();
  if (Array.isArray(fromOv)) {
    for (const c of fromOv) {
      const ck = byHanja.get(c);
      if (!ck || ck.gradeLabel !== k.gradeLabel) continue;
      if (!blocked.has(c)) overrideCands.add(c);
    }
  }

  const scored = [...cand]
    .filter((c) => !blocked.has(c) && !overrideCands.has(c))
    .map((c) => {
      const ck = byHanja.get(c);
      return ck ? { c, s: scoreConfusable(k, ck) } : null;
    })
    .filter((x) => x && x.s >= 2)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);

  // Override를 앞에 배치하고 나머지를 뒤에 추가, 최대 4개
  const confusables = [...overrideCands, ...scored].slice(0, 4);

  // examples: curated override, else fallback from meaning
  let exampleWord = undefined;
  let exampleMeaning = undefined;
  const ov = examples[k.hanja];
  if (ov && ov.exampleWord && ov.exampleMeaning) {
    exampleWord = String(ov.exampleWord).trim();
    exampleMeaning = String(ov.exampleMeaning).trim();
  } else {
    const w = pickExampleWordFromMeaning(k.meaning);
    const m = normalizeMeaning(k.meaning);
    if (w && m && m.length <= 40) {
      exampleWord = w;
      exampleMeaning = m;
    }
  }

  return {
    ...k,
    confusables,
    exampleWord,
    exampleMeaning,
  };
});

saveJson(outDataPath, enriched);
saveJson(outWebPath, enriched);

function writeManifest(dataFilePath, manifestPath) {
  const checksum = sha256FileHex(dataFilePath);
  const created_at = isoFromSourceDateEpoch() || new Date().toISOString();
  const manifest = {
    dataset_version: DATASET_VERSION,
    schema_version: SCHEMA_VERSION,
    build_id: checksum.slice(0, 16),
    checksum: {
      algo: 'sha256',
      hex: checksum,
      file: path.basename(dataFilePath),
    },
    created_at,
  };
  saveJson(manifestPath, manifest);
}

// Keep manifests next to each consumer.
writeManifest(outDataPath, path.join(path.dirname(outDataPath), 'manifest.json'));
writeManifest(outWebPath, path.join(path.dirname(outWebPath), 'manifest.json'));

// report
const countBy = (label) => {
  const items = enriched.filter((k) => k.gradeLabel === label);
  const withEx = items.filter((k) => k.exampleWord && k.exampleMeaning).length;
  const withConf2 = items.filter((k) => (k.confusables || []).length >= 2).length;
  return { total: items.length, withEx, withConf2 };
};

const labels = [...new Set(enriched.map((k) => k.gradeLabel))];
console.log('built', enriched.length, 'items');
for (const l of labels) console.log(l, countBy(l));
