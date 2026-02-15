'use client';

import { ALL_KANJI } from '@/lib/kanji';
import { loadState } from '@/lib/storage';

export type ExportKind = 'weak' | 'due';
export type ExportFormat = 'ids' | 'json';

export type ExportSize = 'short' | 'normal' | 'long';

export function sizeToLimit(size: ExportSize): number {
  if (size === 'short') return 10;
  if (size === 'long') return 100;
  return 50;
}

export function exportLabel(opts: { kind: ExportKind; format: ExportFormat }): string {
  const a = opts.kind === 'weak' ? '약점' : '복습 대기';
  const b = opts.format === 'ids' ? 'ID' : 'JSON';
  return `${a} ${b}`;
}

export function buildExport(opts: { kind: ExportKind; format: ExportFormat; limit: number; now: number }): {
  text: string;
  filename: string;
  charCount: number;
  itemCount: number;
} {
  const st = loadState();
  const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));

  if (opts.kind === 'weak') {
    const rows = Object.entries(st.progress)
      .map(([id, p]) => {
        const answered = (p.wrong || 0) + (p.correct || 0) > 0;
        const score = (p.wrong + 1) / (p.correct + 1);
        const due = !!p && !p.mastered && p.nextReviewAt <= opts.now;
        return { id, answered, score, wrong: p.wrong, correct: p.correct, due, nextReviewAt: p.nextReviewAt };
      })
      .filter((w) => w.answered)
      .sort((a, b) => {
        // weak first
        if (b.score !== a.score) return b.score - a.score;
        if (b.wrong !== a.wrong) return b.wrong - a.wrong;
        return (a.nextReviewAt || 0) - (b.nextReviewAt || 0);
      })
      .slice(0, Math.max(1, opts.limit));

    if (opts.format === 'ids') {
      const text = rows.map((r) => r.id).join('\n');
      return {
        text,
        filename: `hanja-study-weak-top${rows.length}.txt`,
        charCount: text.length,
        itemCount: rows.length,
      };
    }

    const items = rows.map((r) => {
      const k = map.get(r.id);
      return {
        id: r.id,
        hanja: k?.hanja,
        gradeLabel: k?.gradeLabel,
        reading: k?.reading,
        meaning: k?.meaning,
        wrong: r.wrong,
        correct: r.correct,
        due: r.due,
        exampleWord: k?.exampleWord,
        exampleMeaning: k?.exampleMeaning,
      };
    });

    const text = JSON.stringify(
      {
        version: 1,
        generatedAt: new Date(opts.now).toISOString(),
        note: `weak (answered) top ${rows.length} export (local-only)`,
        items,
      },
      null,
      2
    );

    return {
      text,
      filename: `hanja-study-weak-top${rows.length}.json`,
      charCount: text.length,
      itemCount: rows.length,
    };
  }

  // due
  const dueRows = Object.entries(st.progress)
    .map(([id, p]) => ({ id, due: !p.mastered && p.nextReviewAt <= opts.now, wrong: p.wrong, correct: p.correct, nextReviewAt: p.nextReviewAt }))
    .filter((w) => w.due)
    .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
    .slice(0, Math.max(1, opts.limit));

  if (opts.format === 'ids') {
    const text = dueRows.map((r) => r.id).join('\n');
    return {
      text,
      filename: `hanja-study-due-top${dueRows.length}.txt`,
      charCount: text.length,
      itemCount: dueRows.length,
    };
  }

  const items = dueRows.map((r) => {
    const k = map.get(r.id);
    return {
      id: r.id,
      hanja: k?.hanja,
      gradeLabel: k?.gradeLabel,
      reading: k?.reading,
      meaning: k?.meaning,
      wrong: r.wrong,
      correct: r.correct,
      due: r.due,
      exampleWord: k?.exampleWord,
      exampleMeaning: k?.exampleMeaning,
    };
  });

  const text = JSON.stringify(
    {
      version: 1,
      generatedAt: new Date(opts.now).toISOString(),
      note: `due top ${dueRows.length} export (local-only)`,
      items,
    },
    null,
    2
  );

  return {
    text,
    filename: `hanja-study-due-top${dueRows.length}.json`,
    charCount: text.length,
    itemCount: dueRows.length,
  };
}
