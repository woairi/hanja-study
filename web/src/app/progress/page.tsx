'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Toast from '@/components/Toast';
import { ALL_KANJI, GRADE_LABELS, kanjiByGradeLabel } from '@/lib/kanji';
import { loadState } from '@/lib/storage';
import type { GradeLabel } from '@/lib/types';

export default function ProgressPage() {
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);

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

  const weakExportJson = useMemo(() => {
    const st = loadState();
    const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));
    const top = Object.entries(st.progress)
      .map(([id, p]) => ({ id, score: (p.wrong + 1) / (p.correct + 1), wrong: p.wrong, correct: p.correct, p }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((w) => {
        const k = map.get(w.id);
        const due = !!w.p && !w.p.mastered && w.p.nextReviewAt <= now;
        return {
          id: w.id,
          hanja: k?.hanja,
          gradeLabel: k?.gradeLabel,
          reading: k?.reading,
          meaning: k?.meaning,
          wrong: w.wrong,
          correct: w.correct,
          due,
          exampleWord: k?.exampleWord,
          exampleMeaning: k?.exampleMeaning,
        };
      });

    return JSON.stringify(
      {
        version: 1,
        generatedAt: new Date(now).toISOString(),
        note: 'weak top 50 export (local-only)',
        items: top,
      },
      null,
      2
    );
  }, [now]);

  const totalDue = useMemo(() => {
    const st = loadState();
    return ALL_KANJI.filter((k) => {
      const p = st.progress[k.id];
      return p && !p.mastered && p.nextReviewAt <= now;
    }).length;
  }, [now]);

  const reviewLink = useMemo(() => {
    const st = loadState();
    const dailyCount = Math.min(10, st.settings.dailyCount);
    // pick the grade with the most due items; if none due, pick the first grade.
    let best: { label: GradeLabel; due: number } | null = null;
    for (const label of GRADE_LABELS) {
      const items = kanjiByGradeLabel(label);
      const due = items.filter((k) => {
        const p = st.progress[k.id];
        return p && !p.mastered && p.nextReviewAt <= now;
      }).length;
      if (!best || due > best.due) best = { label, due };
    }
    const label = best?.label ?? '8급';
    return `/study?grade=${encodeURIComponent(label)}&n=${dailyCount}&review=1`;
  }, [now]);

  return (
    <main className="mx-auto max-w-md p-4">
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
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
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            복습 대기: <span className="font-semibold">{totalDue}</span>개
          </div>
          <Link
            href={totalDue > 0 ? reviewLink : '#'}
            onClick={(e) => {
              if (totalDue <= 0) {
                e.preventDefault();
                setToast('복습 대기가 없어! 🎉');
              }
            }}
            className={`btn btn-primary focus-ring inline-flex items-center justify-center px-4 py-2 ${
              totalDue > 0 ? '' : 'opacity-70'
            }`}
            aria-disabled={totalDue <= 0}
          >
            복습 시작
          </Link>
        </div>
        <div className="mt-2 text-xs text-gray-500">복습 모드는 복습 대기(due)만 출제돼.</div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">취약 TOP 10</h2>
          <button
            className="btn btn-ghost focus-ring px-3 py-2 text-xs"
            onClick={async () => {
              const txt = weakExportJson;
              try {
                if (navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(txt);
                } else {
                  const ta = document.createElement('textarea');
                  ta.value = txt;
                  ta.setAttribute('readonly', '');
                  ta.style.position = 'fixed';
                  ta.style.left = '-9999px';
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                }
                setToast('약점 목록을 복사했어! 채팅에 붙여넣어줘.');
              } catch {
                setToast('복사 실패 😭 아래 목록을 길게 눌러서 복사해줘.');
              }
            }}
          >
            약점목록 복사
          </button>
        </div>

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

        <details className="mt-3">
          <summary className="text-xs text-gray-500">(대체) 복사가 안 되면 여기 펼쳐서 복사</summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">
            {weakExportJson}
          </pre>
        </details>
      </section>
    </main>
  );
}

function GradeRow(props: { label: GradeLabel; total: number; seen: number; mastered: number; due: number }) {
  const { label, total, seen, mastered, due } = props;
  const pct = total ? Math.round((mastered / total) * 100) : 0;

  const weakInGrade = useMemo(() => {
    const st = loadState();
    const items = kanjiByGradeLabel(label);
    const scored = items
      .filter((k) => !!st.progress[k.id])
      .map((k) => {
        const p = st.progress[k.id];
        const score = (p.wrong + 1) / (p.correct + 1);
        return { k, p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored;
  }, [label]);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-extrabold">{label}</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          마스터 {pct}%
        </div>
      </div>
      <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        학습 {seen}/{total} · 마스터 {mastered}/{total} · 복습 대기 {due}
      </div>
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded" style={{ width: `${pct}%`, background: 'linear-gradient(180deg, var(--primary), var(--primary-600))' }} />
      </div>

      {weakInGrade.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white/60 px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
          <div className="font-extrabold">약점 TOP</div>
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            {weakInGrade.map(({ k, p }) => (
              <li key={k.id}>
                <div>
                  <span className="font-extrabold text-slate-900">{k.hanja}</span> {k.meaning} {k.reading}{' '}
                  <span className="text-slate-500">(오답 {p.wrong}/정답 {p.correct})</span>
                </div>
                {k.exampleWord && (
                  <div className="mt-0.5 text-slate-500">
                    예: <span className="font-extrabold">{k.exampleWord}</span>
                    {k.exampleMeaning ? ` · ${k.exampleMeaning}` : ''}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-2">
            <Link
              href={`/study?grade=${encodeURIComponent(label)}&n=${Math.min(10, loadState().settings.dailyCount)}&focus=weak`}
              className="btn btn-primary focus-ring inline-flex items-center justify-center px-4 py-2"
              onClick={() => {
                // store weak ids for focus mode
                window.sessionStorage.setItem('hanja-study:focus', JSON.stringify(weakInGrade.map((x) => x.k.id)));
              }}
            >
              약점만 복습
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
