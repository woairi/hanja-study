'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ALL_KANJI, GRADE_LABELS, kanjiByGradeLabel } from '@/lib/kanji';
import { loadState } from '@/lib/storage';
import type { GradeLabel } from '@/lib/types';

export default function ProgressPage() {
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const summary = useMemo(() => {
    const st = loadState();
    const days = period === 'week' ? 7 : 30;

    // Build YYYY-MM-DD keys for the last N days (including today).
    const keys: string[] = [];
    const d = new Date(now);
    for (let i = 0; i < days; i++) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      const yyyy = x.getFullYear();
      const mm = String(x.getMonth() + 1).padStart(2, '0');
      const dd = String(x.getDate()).padStart(2, '0');
      keys.push(`${yyyy}-${mm}-${dd}`);
    }

    let answered = 0;
    let correct = 0;
    let wrong = 0;
    let studyDays = 0;

    for (const k of keys) {
      const day = st.stats.daily?.[k];
      if (!day) continue;
      answered += day.answered || 0;
      correct += day.correct || 0;
      wrong += day.wrong || 0;
      if ((day.answered || 0) > 0) studyDays += 1;
    }

    const acc = answered > 0 ? Math.round((correct / answered) * 100) : null;

    const quizAnsweredAllTime = st.stats?.quizAnswered || 0;
    const dailyKeys = Object.keys(st.stats.daily || {});

    return {
      days,
      studyDays,
      answered,
      correct,
      wrong,
      acc,
      quizAnsweredAllTime,
      isEmpty: quizAnsweredAllTime === 0 && dailyKeys.length === 0,
    };
  }, [now, period]);

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
      .filter((w) => w.wrong + w.correct > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [now]);

  const dueTop = useMemo(() => {
    const st = loadState();
    return Object.entries(st.progress)
      .map(([id, p]) => ({ id, wrong: p.wrong, correct: p.correct, due: !p.mastered && p.nextReviewAt <= now, nextReviewAt: p.nextReviewAt }))
      .filter((w) => w.due)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .slice(0, 10);
  }, [now]);

  const weakIdsText = useMemo(() => {
    const st = loadState();
    const top = Object.entries(st.progress)
      .map(([id, p]) => {
        const answered = (p.wrong || 0) + (p.correct || 0) > 0;
        const score = (p.wrong + 1) / (p.correct + 1);
        return { id, answered, score, wrong: p.wrong, correct: p.correct, nextReviewAt: p.nextReviewAt };
      })
      .filter((w) => w.answered)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.wrong !== a.wrong) return b.wrong - a.wrong;
        return (a.nextReviewAt || 0) - (b.nextReviewAt || 0);
      })
      .slice(0, 50)
      .map((w) => w.id);

    return top.join('\n');
  }, [now]);

  const dueIdsText = useMemo(() => {
    const st = loadState();
    const top = Object.entries(st.progress)
      .map(([id, p]) => ({ id, due: !p.mastered && p.nextReviewAt <= now, nextReviewAt: p.nextReviewAt }))
      .filter((w) => w.due)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .slice(0, 50)
      .map((w) => w.id);

    return top.join('\n');
  }, [now]);

  const weakExportJson = useMemo(() => {
    const st = loadState();
    const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));

    const top = Object.entries(st.progress)
      .map(([id, p]) => {
        const due = !!p && !p.mastered && p.nextReviewAt <= now;
        const answered = (p.wrong || 0) + (p.correct || 0) > 0;
        const score = (p.wrong + 1) / (p.correct + 1);
        return {
          id,
          wrong: p.wrong,
          correct: p.correct,
          due,
          answered,
          score,
          nextReviewAt: p.nextReviewAt,
        };
      })
      .filter((w) => w.answered)
      .sort((a, b) => {
        // weak first
        if (b.score !== a.score) return b.score - a.score;
        if (b.wrong !== a.wrong) return b.wrong - a.wrong;
        return (a.nextReviewAt || 0) - (b.nextReviewAt || 0);
      })
      .slice(0, 50)
      .map((w) => {
        const k = map.get(w.id);
        return {
          id: w.id,
          hanja: k?.hanja,
          gradeLabel: k?.gradeLabel,
          reading: k?.reading,
          meaning: k?.meaning,
          wrong: w.wrong,
          correct: w.correct,
          due: w.due,
          exampleWord: k?.exampleWord,
          exampleMeaning: k?.exampleMeaning,
        };
      });

    return JSON.stringify(
      {
        version: 1,
        generatedAt: new Date(now).toISOString(),
        note: 'weak (answered) top 50 export (local-only)',
        items: top,
      },
      null,
      2
    );
  }, [now]);

  const dueExportJson = useMemo(() => {
    const st = loadState();
    const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));

    const top = Object.entries(st.progress)
      .map(([id, p]) => {
        const due = !!p && !p.mastered && p.nextReviewAt <= now;
        return { id, due, wrong: p.wrong, correct: p.correct, nextReviewAt: p.nextReviewAt };
      })
      .filter((w) => w.due)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .slice(0, 50)
      .map((w) => {
        const k = map.get(w.id);
        return {
          id: w.id,
          hanja: k?.hanja,
          gradeLabel: k?.gradeLabel,
          reading: k?.reading,
          meaning: k?.meaning,
          wrong: w.wrong,
          correct: w.correct,
          due: w.due,
          exampleWord: k?.exampleWord,
          exampleMeaning: k?.exampleMeaning,
        };
      });

    return JSON.stringify(
      {
        version: 1,
        generatedAt: new Date(now).toISOString(),
        note: 'due top 50 export (local-only)',
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

      <section className="mt-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">요약</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={period === 'week' ? 'primary' : 'ghost'}
              size="sm"
              aria-pressed={period === 'week'}
              onClick={() => setPeriod('week')}
            >
              주간
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'ghost'}
              size="sm"
              aria-pressed={period === 'month'}
              onClick={() => setPeriod('month')}
            >
              월간
            </Button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2">
          <Card className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
                  📅 학습일수 ({summary.days}일)
                </div>
                <div className="mt-1 text-2xl font-extrabold">
                  {summary.studyDays}
                  <span className="ml-1 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                    일
                  </span>
                </div>
              </div>
              <div className="text-right text-xs" style={{ color: 'var(--muted)' }}>
                {summary.studyDays === 0 ? '아직 기록이 없어' : '꾸준함이 쌓이는 중'}
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
                  🎯 정답률 ({summary.days}일)
                </div>
                <div className="mt-1 text-2xl font-extrabold">
                  {summary.acc === null ? '—' : `${summary.acc}%`}
                </div>
              </div>
              <div className="text-right text-xs" style={{ color: 'var(--muted)' }}>
                정답 {summary.correct} · 오답 {summary.wrong}
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
                  🧮 문제수
                </div>
                <div className="mt-1 text-2xl font-extrabold">{summary.answered}</div>
              </div>
              <div className="text-right text-xs" style={{ color: 'var(--muted)' }}>
                누적 {summary.quizAnsweredAllTime}문제
              </div>
            </div>
          </Card>
        </div>

        {summary.isEmpty && (
          <Card className="mt-3 p-4">
            <div className="text-sm font-extrabold">진도가 비어 있어</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              아래 순서로 시작하면 여기서 성장 그래프가 잡혀!
            </div>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm" style={{ color: 'var(--muted)' }}>
              <li>
                <Link className="text-blue-700 underline" href="/">
                  홈
                </Link>
                에서 오늘의 학습을 시작
              </li>
              <li>학습을 끝내고 퀴즈로 몇 문제 풀기</li>
              <li>다시 /progress로 돌아오면 주간/월간 요약이 보여</li>
            </ol>
          </Card>
        )}
      </section>

      <section className="mt-4 space-y-2">
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
          <h2 className="text-base font-semibold">취약 TOP 10 (오답 기반)</h2>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={async () => {
                const txt = weakIdsText;
                try {
                  await navigator.clipboard.writeText(txt);
                  setToast('약점ID(오답 기반) 50개를 복사했어!');
                } catch {
                  setToast('복사 실패 😭 아래 목록을 길게 눌러서 복사해줘.');
                }
              }}
            >
              약점ID
            </button>
            <button
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={async () => {
                const txt = dueIdsText;
                try {
                  await navigator.clipboard.writeText(txt);
                  setToast('due ID 50개를 복사했어!');
                } catch {
                  setToast('복사 실패 😭 아래 목록을 길게 눌러서 복사해줘.');
                }
              }}
            >
              dueID
            </button>
            <button
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={async () => {
                const txt = weakExportJson;
                try {
                  await navigator.clipboard.writeText(txt);
                  setToast('약점(JSON)을 복사했어!');
                } catch {
                  setToast('복사 실패 😭 아래 목록을 길게 눌러서 복사해줘.');
                }
              }}
            >
              약점JSON
            </button>
            <button
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={async () => {
                const txt = dueExportJson;
                try {
                  await navigator.clipboard.writeText(txt);
                  setToast('due(JSON)을 복사했어!');
                } catch {
                  setToast('복사 실패 😭 아래 목록을 길게 눌러서 복사해줘.');
                }
              }}
            >
              dueJSON
            </button>
          </div>
        </div>

        {weak.length === 0 ? (
          <div className="mt-2 text-sm text-gray-600">
            아직 오답 데이터가 없어. 퀴즈를 몇 문제 풀면 여기서 약점이 잡혀!
          </div>
        ) : (
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
        )}

        {dueTop.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
              복습 대기 TOP 10
            </div>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs text-gray-600">
              {dueTop.map((w) => {
                const k = ALL_KANJI.find((x) => x.id === w.id);
                return (
                  <li key={w.id}>
                    {k ? (
                      <span>
                        <span className="font-semibold">{k.hanja}</span> {k.meaning} {k.reading}{' '}
                        <span className="text-gray-500">({k.gradeLabel})</span>
                      </span>
                    ) : (
                      <span className="font-mono">{w.id}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <details className="mt-3">
          <summary className="text-xs text-gray-500">(대체) 복사가 안 되면 여기 펼쳐서 복사</summary>
          <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">
            {weakExportJson}
          </pre>
          <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">
            {dueExportJson}
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
