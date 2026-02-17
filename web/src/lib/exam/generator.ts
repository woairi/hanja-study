'use client';

import { kanjiByGradeLabel, ALL_KANJI } from '../kanji';
import type { KanjiItem, GradeLabel } from '../types';

// ─── Lexicon (antonyms / synonyms / idioms) ───

type AntonymSynonymEntry = { a: string; b: string; label: string; grades: string[] };
type IdiomEntry = { chars: string; reading: string; meaning: string; minGrade: string };

// Inline-require to avoid JSON import issues with Next.js client components
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lexicon: {
  antonyms: AntonymSynonymEntry[];
  synonyms: AntonymSynonymEntry[];
  idioms: IdiomEntry[];
} = require('@/data/examLexicon.json');

// ─── Types ───

export type ExamType =
  | 'read_hanja'
  | 'meaning_reading'
  | 'write_hanja'
  | 'radical_strokes'
  | 'antonym_synonym'
  | 'idiom'
  | 'matching';

export type ExamQuestion = {
  id: string;
  type: ExamType;
  prompt: string;
  subtitle?: string;
  options: { text: string; value: string }[];
  answer: string;
  kanjiId: string;
  /** 짝짓기 전용: 매칭 쌍 */
  matchPairs?: { left: string; right: string }[];
};

export type ExamBlueprint = {
  gradeLabel: GradeLabel;
  questionCount: number;
  passScore: number;
  quickCount: number;
  composition: { type: ExamType; ratio: number; difficulty: number }[];
};

export type ExamMode = 'quick' | 'full' | 'type_practice';

// ─── Blueprint ───

const DEFAULT_COMP_EASY: ExamBlueprint['composition'] = [
  { type: 'read_hanja', ratio: 0.35, difficulty: 1 },
  { type: 'meaning_reading', ratio: 0.35, difficulty: 1 },
  { type: 'write_hanja', ratio: 0.20, difficulty: 1 },
  { type: 'radical_strokes', ratio: 0.10, difficulty: 1 },
];
const DEFAULT_COMP_MID: ExamBlueprint['composition'] = [
  { type: 'read_hanja', ratio: 0.25, difficulty: 3 },
  { type: 'meaning_reading', ratio: 0.25, difficulty: 3 },
  { type: 'write_hanja', ratio: 0.25, difficulty: 3 },
  { type: 'radical_strokes', ratio: 0.25, difficulty: 3 },
];
const DEFAULT_COMP_HARD: ExamBlueprint['composition'] = [
  { type: 'read_hanja', ratio: 0.20, difficulty: 5 },
  { type: 'meaning_reading', ratio: 0.20, difficulty: 5 },
  { type: 'write_hanja', ratio: 0.25, difficulty: 5 },
  { type: 'radical_strokes', ratio: 0.35, difficulty: 5 },
];

const blueprints: ExamBlueprint[] = [
  { gradeLabel: '8급', questionCount: 50, passScore: 70, quickCount: 10, composition: DEFAULT_COMP_EASY },
  { gradeLabel: '7급', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.30, difficulty: 2 },
    { type: 'meaning_reading', ratio: 0.30, difficulty: 2 },
    { type: 'write_hanja', ratio: 0.20, difficulty: 2 },
    { type: 'radical_strokes', ratio: 0.20, difficulty: 2 },
  ]},
  { gradeLabel: '7급Ⅱ', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.30, difficulty: 2 },
    { type: 'meaning_reading', ratio: 0.30, difficulty: 2 },
    { type: 'write_hanja', ratio: 0.20, difficulty: 2 },
    { type: 'radical_strokes', ratio: 0.20, difficulty: 2 },
  ]},
  { gradeLabel: '6급', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.20, difficulty: 3 },
    { type: 'meaning_reading', ratio: 0.20, difficulty: 3 },
    { type: 'write_hanja', ratio: 0.20, difficulty: 3 },
    { type: 'radical_strokes', ratio: 0.15, difficulty: 3 },
    { type: 'antonym_synonym', ratio: 0.10, difficulty: 3 },
    { type: 'idiom', ratio: 0.10, difficulty: 3 },
    { type: 'matching', ratio: 0.05, difficulty: 3 },
  ]},
  { gradeLabel: '6급Ⅱ', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.20, difficulty: 3 },
    { type: 'meaning_reading', ratio: 0.20, difficulty: 3 },
    { type: 'write_hanja', ratio: 0.20, difficulty: 3 },
    { type: 'radical_strokes', ratio: 0.15, difficulty: 3 },
    { type: 'antonym_synonym', ratio: 0.10, difficulty: 3 },
    { type: 'idiom', ratio: 0.10, difficulty: 3 },
    { type: 'matching', ratio: 0.05, difficulty: 3 },
  ]},
  { gradeLabel: '5급', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.15, difficulty: 4 },
    { type: 'meaning_reading', ratio: 0.15, difficulty: 4 },
    { type: 'write_hanja', ratio: 0.20, difficulty: 4 },
    { type: 'radical_strokes', ratio: 0.15, difficulty: 4 },
    { type: 'antonym_synonym', ratio: 0.15, difficulty: 4 },
    { type: 'idiom', ratio: 0.10, difficulty: 4 },
    { type: 'matching', ratio: 0.10, difficulty: 4 },
  ]},
  { gradeLabel: '4급', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.15, difficulty: 5 },
    { type: 'meaning_reading', ratio: 0.15, difficulty: 5 },
    { type: 'write_hanja', ratio: 0.15, difficulty: 5 },
    { type: 'radical_strokes', ratio: 0.15, difficulty: 5 },
    { type: 'antonym_synonym', ratio: 0.15, difficulty: 5 },
    { type: 'idiom', ratio: 0.15, difficulty: 5 },
    { type: 'matching', ratio: 0.10, difficulty: 5 },
  ]},
  { gradeLabel: '4급Ⅱ', questionCount: 50, passScore: 70, quickCount: 10, composition: [
    { type: 'read_hanja', ratio: 0.15, difficulty: 5 },
    { type: 'meaning_reading', ratio: 0.15, difficulty: 5 },
    { type: 'write_hanja', ratio: 0.15, difficulty: 5 },
    { type: 'radical_strokes', ratio: 0.15, difficulty: 5 },
    { type: 'antonym_synonym', ratio: 0.15, difficulty: 5 },
    { type: 'idiom', ratio: 0.15, difficulty: 5 },
    { type: 'matching', ratio: 0.10, difficulty: 5 },
  ]},
];

export function getBlueprint(grade: GradeLabel): ExamBlueprint {
  return blueprints.find((b) => b.gradeLabel === grade) || blueprints[0];
}

// ─── Shuffle ───

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffle(arr).slice(0, count);
}

// ─── Distractor helpers ───

function pickDistractorValues(
  correct: string,
  pool: string[],
  count: number,
): string[] {
  const set = new Set<string>();
  const shuffled = shuffle(pool);
  for (const v of shuffled) {
    if (v === correct) continue;
    if (set.has(v)) continue;
    set.add(v);
    if (set.size >= count) break;
  }
  return [...set];
}

function getGradePool(grade: GradeLabel): KanjiItem[] {
  const items = kanjiByGradeLabel(grade);
  if (items.length >= 20) return items;
  // 한자가 적은 급수면 전체에서 보충
  return ALL_KANJI;
}

// ─── Question generators ───

/** 독음: 한자를 보고 음 고르기 */
function genReadHanja(k: KanjiItem, pool: KanjiItem[]): ExamQuestion {
  const distractors = pickDistractorValues(
    k.reading,
    pool.map((x) => x.reading),
    3,
  );
  const options = shuffle([k.reading, ...distractors]).map((v) => ({ text: v, value: v }));
  return {
    id: '',
    type: 'read_hanja',
    prompt: k.hanja,
    subtitle: '이 한자의 음(소리)은?',
    options,
    answer: k.reading,
    kanjiId: k.id,
  };
}

/** 훈음: 한자를 보고 뜻+음 고르기 */
function genMeaningReading(k: KanjiItem, pool: KanjiItem[]): ExamQuestion {
  const correctText = `${k.meaning} ${k.reading}`;
  const distractorItems = shuffle(pool.filter((x) => x.id !== k.id)).slice(0, 5);

  // 혼동 유발: 뜻만 맞고 음 틀림, 음만 맞고 뜻 틀림, 둘 다 틀림
  const candidates = new Set<string>();
  for (const d of distractorItems) {
    candidates.add(`${d.meaning} ${d.reading}`);
    candidates.add(`${k.meaning} ${d.reading}`); // 뜻 맞음 + 음 틀림
    candidates.add(`${d.meaning} ${k.reading}`); // 뜻 틀림 + 음 맞음
  }
  candidates.delete(correctText);

  const distractors = pickRandom([...candidates], 3);
  const options = shuffle([correctText, ...distractors]).map((v) => ({ text: v, value: v }));

  return {
    id: '',
    type: 'meaning_reading',
    prompt: k.hanja,
    subtitle: '이 한자의 훈(뜻)과 음은?',
    options,
    answer: correctText,
    kanjiId: k.id,
  };
}

/** 한자 쓰기: 뜻/음을 보고 한자 고르기 */
function genWriteHanja(k: KanjiItem, pool: KanjiItem[]): ExamQuestion {
  // confusables 우선, 부족하면 동급수
  const confusableItems = (k.confusables || [])
    .map((h) => pool.find((x) => x.hanja === h))
    .filter((x): x is KanjiItem => !!x);

  const distractorHanja = new Set<string>();
  for (const c of confusableItems) {
    distractorHanja.add(c.hanja);
    if (distractorHanja.size >= 3) break;
  }
  // 부족하면 동급수에서 보충
  if (distractorHanja.size < 3) {
    for (const x of shuffle(pool)) {
      if (x.id === k.id || distractorHanja.has(x.hanja)) continue;
      distractorHanja.add(x.hanja);
      if (distractorHanja.size >= 3) break;
    }
  }

  const options = shuffle([k.hanja, ...distractorHanja]).map((v) => ({ text: v, value: v }));

  return {
    id: '',
    type: 'write_hanja',
    prompt: `${k.meaning} ${k.reading}`,
    subtitle: '뜻과 음에 맞는 한자는?',
    options,
    answer: k.hanja,
    kanjiId: k.id,
  };
}

/** 부수/획수 */
function genRadicalStrokes(k: KanjiItem, pool: KanjiItem[]): ExamQuestion {
  // 50% 확률로 부수 / 획수 문제
  const isRadical = Math.random() < 0.5;

  if (isRadical) {
    const correctRadical = k.radical || '?';
    const distractors = pickDistractorValues(
      correctRadical,
      pool.map((x) => x.radical || '?').filter((r) => r !== '?'),
      3,
    );
    const options = shuffle([correctRadical, ...distractors]).map((v) => ({ text: v, value: v }));
    return {
      id: '',
      type: 'radical_strokes',
      prompt: k.hanja,
      subtitle: '이 한자의 부수는?',
      options,
      answer: correctRadical,
      kanjiId: k.id,
    };
  } else {
    const correctStrokes = String(k.totalStrokes || 0);
    // ±1~3획 오답
    const base = k.totalStrokes || 5;
    const candidates = new Set<string>();
    for (const offset of [-2, -1, 1, 2, 3, -3]) {
      const v = base + offset;
      if (v > 0 && String(v) !== correctStrokes) candidates.add(String(v));
    }
    const distractors = pickRandom([...candidates], 3);
    const options = shuffle([correctStrokes, ...distractors]).map((v) => ({
      text: `${v}획`,
      value: v,
    }));
    return {
      id: '',
      type: 'radical_strokes',
      prompt: k.hanja,
      subtitle: '이 한자의 총 획수는?',
      options,
      answer: correctStrokes,
      kanjiId: k.id,
    };
  }
}

// ─── Generator map ───

// 급수 난이도 순서 (낮은 급수 = 쉬움)
const GRADE_ORDER: GradeLabel[] = ['8급', '7급Ⅱ', '7급', '6급Ⅱ', '6급', '5급', '4급Ⅱ', '4급'];

function gradeRank(g: string): number {
  const idx = GRADE_ORDER.indexOf(g as GradeLabel);
  return idx >= 0 ? idx : 99;
}

/** 해당 급수 이하에서 사용 가능한 반대어/유의어 필터 */
function lexiconForGrade(grade: GradeLabel) {
  const rank = gradeRank(grade);
  const ants = lexicon.antonyms.filter((e) =>
    e.grades.some((g) => gradeRank(g) <= rank),
  );
  const syns = lexicon.synonyms.filter((e) =>
    e.grades.some((g) => gradeRank(g) <= rank),
  );
  const idioms = lexicon.idioms.filter((e) => gradeRank(e.minGrade) <= rank);
  return { antonyms: ants, synonyms: syns, idioms };
}

/** 반대어/유의어: 한자를 보고 반대어 또는 유의어 고르기 */
function genAntonymSynonym(k: KanjiItem, pool: KanjiItem[], grade: GradeLabel): ExamQuestion | null {
  const { antonyms, synonyms } = lexiconForGrade(grade);
  const combined = [
    ...antonyms.map((e) => ({ ...e, kind: '반대어' as const })),
    ...synonyms.map((e) => ({ ...e, kind: '유의어' as const })),
  ];

  // k.hanja가 포함된 쌍 찾기
  const matches = combined.filter((e) => e.a === k.hanja || e.b === k.hanja);
  if (matches.length === 0) return null;

  const entry = matches[Math.floor(Math.random() * matches.length)];
  const answer = entry.a === k.hanja ? entry.b : entry.a;

  const distractors = pickDistractorValues(
    answer,
    pool.map((x) => x.hanja),
    3,
  );
  const options = shuffle([answer, ...distractors]).map((v) => ({ text: v, value: v }));

  return {
    id: '',
    type: 'antonym_synonym',
    prompt: k.hanja,
    subtitle: `이 한자의 ${entry.kind}는?`,
    options,
    answer,
    kanjiId: k.id,
  };
}

/** 사자성어: 빈칸 또는 뜻 고르기 */
function genIdiom(_k: KanjiItem, _pool: KanjiItem[], grade: GradeLabel): ExamQuestion | null {
  const { idioms } = lexiconForGrade(grade);
  if (idioms.length === 0) return null;

  const entry = idioms[Math.floor(Math.random() * idioms.length)];
  const isReadingQ = Math.random() < 0.5;

  if (isReadingQ) {
    // 한자를 보고 올바른 읽기 고르기
    const distractors = pickDistractorValues(
      entry.reading,
      idioms.map((e) => e.reading),
      3,
    );
    // 부족하면 랜덤 읽기 생성
    while (distractors.length < 3) {
      const filler = idioms[Math.floor(Math.random() * idioms.length)].reading + '?';
      if (filler !== entry.reading && !distractors.includes(filler)) distractors.push(filler);
    }
    const options = shuffle([entry.reading, ...distractors.slice(0, 3)]).map((v) => ({ text: v, value: v }));
    return {
      id: '',
      type: 'idiom',
      prompt: entry.chars,
      subtitle: '이 사자성어의 읽기는?',
      options,
      answer: entry.reading,
      kanjiId: `idiom-${entry.chars}`,
    };
  } else {
    // 읽기를 보고 뜻 고르기
    const distractors = pickDistractorValues(
      entry.meaning,
      idioms.map((e) => e.meaning),
      3,
    );
    while (distractors.length < 3) {
      distractors.push('알 수 없음');
    }
    const options = shuffle([entry.meaning, ...distractors.slice(0, 3)]).map((v) => ({ text: v, value: v }));
    return {
      id: '',
      type: 'idiom',
      prompt: entry.chars,
      subtitle: `'${entry.reading}'의 뜻은?`,
      options,
      answer: entry.meaning,
      kanjiId: `idiom-${entry.chars}`,
    };
  }
}

/** 짝짓기: 한자↔뜻 매칭 (4쌍) */
function genMatching(_k: KanjiItem, pool: KanjiItem[]): ExamQuestion {
  const items = pickRandom(pool, 4);
  const pairs = items.map((x) => ({ left: x.hanja, right: `${x.meaning} ${x.reading}` }));

  return {
    id: '',
    type: 'matching',
    prompt: '한자와 뜻을 짝지어봐!',
    subtitle: '같은 것끼리 연결해줘',
    options: [], // 짝짓기는 options 대신 matchPairs 사용
    answer: pairs.map((p) => `${p.left}=${p.right}`).join('|'),
    kanjiId: items[0].id,
    matchPairs: pairs,
  };
}

// P0 generators
const p0Generators: Record<string, (k: KanjiItem, pool: KanjiItem[]) => ExamQuestion> = {
  read_hanja: genReadHanja,
  meaning_reading: genMeaningReading,
  write_hanja: genWriteHanja,
  radical_strokes: genRadicalStrokes,
};

// ─── Main API ───

export function generateExam(
  grade: GradeLabel,
  mode: ExamMode,
  typeFilter?: ExamType,
): ExamQuestion[] {
  const bp = getBlueprint(grade);
  const pool = getGradePool(grade);
  const gradeItems = kanjiByGradeLabel(grade);

  let totalCount: number;
  if (mode === 'quick') {
    totalCount = bp.quickCount;
  } else if (mode === 'type_practice') {
    totalCount = 10;
  } else {
    totalCount = bp.questionCount;
  }

  const questions: ExamQuestion[] = [];

  const generateForType = (type: ExamType, items: KanjiItem[], count: number) => {
    if (type in p0Generators) {
      const gen = p0Generators[type];
      for (const k of pickRandom(items, count)) {
        questions.push(gen(k, pool));
      }
    } else if (type === 'antonym_synonym') {
      // 반대어/유의어 — lexicon 매칭 시도, 실패시 P0 유형으로 대체
      let generated = 0;
      for (const k of shuffle(items)) {
        if (generated >= count) break;
        const q = genAntonymSynonym(k, pool, grade);
        if (q) { questions.push(q); generated++; }
      }
      // 부족하면 독음으로 대체
      for (let i = generated; i < count; i++) {
        const k = pickRandom(items, 1)[0];
        if (k) questions.push(genReadHanja(k, pool));
      }
    } else if (type === 'idiom') {
      for (let i = 0; i < count; i++) {
        const k = pickRandom(items, 1)[0];
        const q = genIdiom(k, pool, grade);
        if (q) questions.push(q);
        else if (k) questions.push(genMeaningReading(k, pool)); // 대체
      }
    } else if (type === 'matching') {
      for (let i = 0; i < count; i++) {
        const k = pickRandom(items, 1)[0];
        if (k) questions.push(genMatching(k, pool));
      }
    }
  };

  if (mode === 'type_practice' && typeFilter) {
    generateForType(typeFilter, gradeItems, totalCount);
  } else {
    for (const comp of bp.composition) {
      const count = Math.max(1, Math.round(totalCount * comp.ratio));
      generateForType(comp.type, gradeItems, count);
    }
  }

  // 셔플 + ID 부여
  return shuffle(questions).slice(0, totalCount).map((q, i) => ({
    ...q,
    id: `exam-${q.type}-${i + 1}`,
  }));
}

/** 합격 여부 */
export function isPass(score: number, total: number, grade: GradeLabel): boolean {
  const bp = getBlueprint(grade);
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return pct >= bp.passScore;
}

/** 유형 라벨 */
export function examTypeLabel(type: ExamType): string {
  switch (type) {
    case 'read_hanja': return '독음';
    case 'meaning_reading': return '훈음';
    case 'write_hanja': return '한자 쓰기';
    case 'radical_strokes': return '부수·획수';
    case 'antonym_synonym': return '반대어·유의어';
    case 'idiom': return '사자성어';
    case 'matching': return '짝짓기';
  }
}
