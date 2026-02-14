import type { KanjiItem } from './types';

export type QuizQuestion = {
  id: string; // question id
  kind: 'meaning' | 'reading' | 'trap';
  prompt: string;
  options: { text: string; value: string }[];
  answer: string;
  kanjiId: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeQuiz(items: KanjiItem[], allSameGrade: KanjiItem[]): QuizQuestion[] {
  const base: QuizQuestion[] = [];

  // 2 questions per item: meaning + reading
  for (const k of items) {
    base.push(makeMeaningQ(k, allSameGrade));
    base.push(makeReadingQ(k, allSameGrade));
  }

  // replace 20% with trap questions
  const trapCount = Math.max(1, Math.floor(base.length * 0.2));
  const idxs = shuffle(base.map((_, i) => i)).slice(0, trapCount);
  for (const i of idxs) {
    const k = items[Math.floor(Math.random() * items.length)];
    base[i] = makeTrapQ(k, allSameGrade);
  }

  return shuffle(base).map((q, i) => ({ ...q, id: `${q.kind}-${i + 1}` }));
}

function pickDistractors(k: KanjiItem, pool: KanjiItem[], field: 'meaning' | 'reading', count: number): string[] {
  const set = new Set<string>();
  for (const x of shuffle(pool)) {
    if (x.id === k.id) continue;
    const v = x[field];
    if (!v) continue;
    if (v === k[field]) continue;
    set.add(v);
    if (set.size >= count) break;
  }
  return [...set];
}

function makeMeaningQ(k: KanjiItem, pool: KanjiItem[]): QuizQuestion {
  const distractors = pickDistractors(k, pool, 'meaning', 3);
  const opts = shuffle([k.meaning, ...distractors]).map((t) => ({ text: t, value: t }));
  return {
    id: '',
    kind: 'meaning',
    prompt: `“${k.hanja}”의 뜻은?`,
    options: opts,
    answer: k.meaning,
    kanjiId: k.id,
  };
}

function makeReadingQ(k: KanjiItem, pool: KanjiItem[]): QuizQuestion {
  const distractors = pickDistractors(k, pool, 'reading', 3);
  const opts = shuffle([k.reading, ...distractors]).map((t) => ({ text: t, value: t }));
  return {
    id: '',
    kind: 'reading',
    prompt: `“${k.hanja}”의 음은?`,
    options: opts,
    answer: k.reading,
    kanjiId: k.id,
  };
}

function makeTrapQ(k: KanjiItem, pool: KanjiItem[]): QuizQuestion {
  const conf = (k.confusables || []).filter(Boolean);
  const confItems = conf
    .map((hanja) => pool.find((x) => x.hanja === hanja))
    .filter((x): x is KanjiItem => !!x);

  const distractorHanja: string[] = [];
  for (const x of confItems) distractorHanja.push(x.hanja);

  for (const x of shuffle(pool)) {
    if (distractorHanja.length >= 3) break;
    if (x.id === k.id) continue;
    if (x.hanja === k.hanja) continue;
    if (distractorHanja.includes(x.hanja)) continue;
    distractorHanja.push(x.hanja);
  }

  const options = shuffle([k.hanja, ...distractorHanja.slice(0, 3)]).map((t) => ({ text: t, value: t }));
  return {
    id: '',
    kind: 'trap',
    prompt: `다음 중 “${k.meaning} ${k.reading}”은?`,
    options,
    answer: k.hanja,
    kanjiId: k.id,
  };
}
