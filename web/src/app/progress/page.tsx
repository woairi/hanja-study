'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ALL_KANJI, GRADE_LABELS, kanjiByGradeLabel } from '@/lib/kanji';
import { loadState } from '@/lib/storage';
import type { GradeLabel } from '@/lib/types';

export default function ProgressPage() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    const st = loadState();
    return GRADE_LABELS.map((label) => {
      const items = kanjiByGradeLabel(label);
      const mastered = items.filter((k) => st.progress[k.id]?.mastered).length;
      const due = items.filter((k) => {
        const p = st.progress[k.id];
        return p && !p.mastered && p.nextReviewAt <= now;
      }).length;
      const seen = items.filter((k) => !!st.progress[k.id]).length;
      return { label, total: items.length, seen, mastered, due };
    });
  }, [now]);

  const weak = useMemo(() => {
    const st = loadState();
    return Object.entries(st.progress)
      .map(([id, p]) => ({ id, score: (p.wrong + 1) / (p.correct + 1), wrong: p.wrong, correct: p.correct }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [now]);

  const totalDue = useMemo(() => {
    const st = loadState();
    return ALL_KANJI.filter((k) => {
      const p = st.progress[k.id];
      return p && !p.mastered && p.nextReviewAt <= now;
    }).length;
  }, [now]);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-600 underline" href="/">
          ← 홈
        </Link>
        <h1 className="text-xl font-bold">진도</h1>
        <div />
      </div>

      <section className="space-y-2">
        {rows.map((r) => (
          <GradeRow key={r.label} {...r} />
        ))}
      </section>

      <section className="card mt-4 p-3">
        <div className="text-sm text-gray-700">
          복습 대기: <span className="font-semibold">{totalDue}</span>개
        </div>
        <div className="mt-2 text-xs text-gray-500">복습은 각 급수에서 학습을 시작하면 자동으로 우선 출제돼.</div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-semibold">취약 TOP 10</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          {weak.map((w) => (
            <li key={w.id}>
              {(() => {
                const k = ALL_KANJI.find((x) => x.id === w.id);
                if (!k) return <span className="font-mono">{w.id}</span>;
                return (
                  <span>
                    <span className="font-semibold">{k.hanja}</span> {k.meaning} {k.reading}{' '}
                    <span className="text-gray-500">({k.gradeLabel})</span>
                  </span>
                );
              })()}
              {' '}· 오답 {w.wrong} / 정답 {w.correct}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function GradeRow(props: { label: GradeLabel; total: number; seen: number; mastered: number; due: number }) {
  const { label, total, seen, mastered, due } = props;
  const pct = total ? Math.round((mastered / total) * 100) : 0;
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">{label}</div>
        <div className="text-xs text-gray-500">마스터 {pct}%</div>
      </div>
      <div className="mt-1 text-sm text-gray-700">학습 {seen}/{total} · 마스터 {mastered}/{total} · 복습 대기 {due}</div>
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
