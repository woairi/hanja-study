'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Toast from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MiniBarChart } from '@/components/ui/MiniBarChart';
import { StateCard } from '@/components/ui/StateCard';
import { ALL_KANJI, GRADE_LABELS, kanjiByGradeLabel } from '@/lib/kanji';
import { loadState } from '@/lib/storage';
import type { AppState, GradeLabel } from '@/lib/types';

const LEGACY_HINT_DISMISSED_KEY = 'hanja-study:progress:legacyHintDismissed:v1';

export default function ProgressPage() {
  const router = useRouter();

  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [legacyHintDismissed, setLegacyHintDismissed] = useState(false);
  const [forceLegacy, setForceLegacy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(LEGACY_HINT_DISMISSED_KEY);
    setLegacyHintDismissed(raw === '1');

    const qs = new URLSearchParams(window.location.search);
    setForceLegacy(qs.get('legacy') === '1');
  }, []);

  const st = useMemo(() => loadState(), [now]);

  const summary = useMemo(() => {
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
    const hasDaily = dailyKeys.length > 0;

    return {
      days,
      studyDays,
      answered,
      correct,
      wrong,
      acc,
      quizAnsweredAllTime,
      hasDaily,
      isEmpty: quizAnsweredAllTime === 0 && dailyKeys.length === 0,
      isLegacyNoDaily: quizAnsweredAllTime > 0 && !hasDaily,
    };
  }, [now, period, st]);

  // 일별 학습량 차트 데이터
  const chartData = useMemo(() => {
    const days = period === 'week' ? 7 : 30;
    const d = new Date(now);
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      const day = st.stats.daily?.[key];
      const label = period === 'week'
        ? ['일', '월', '화', '수', '목', '금', '토'][x.getDay()]
        : `${x.getDate()}`;
      result.push({
        label,
        value: day?.answered || 0,
        highlight: key === today,
      });
    }
    return result;
  }, [now, period, st]);

  // 일별 정답률 차트 데이터
  const accChartData = useMemo(() => {
    const days = period === 'week' ? 7 : 30;
    const d = new Date(now);
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const x = new Date(d);
      x.setDate(d.getDate() - i);
      const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      const day = st.stats.daily?.[key];
      const answered = day?.answered || 0;
      const correct = day?.correct || 0;
      const label = period === 'week'
        ? ['일', '월', '화', '수', '목', '금', '토'][x.getDay()]
        : `${x.getDate()}`;
      result.push({
        label,
        value: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        highlight: key === today,
      });
    }
    return result;
  }, [now, period, st]);

  useEffect(() => {
    if (!summary.isLegacyNoDaily) return;
    if (!legacyHintDismissed) return;
    if (forceLegacy) return;
    router.replace('/');
  }, [summary.isLegacyNoDaily, legacyHintDismissed, forceLegacy, router]);

  const rows = useMemo(() => {
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
  }, [now, st]);

  const weak = useMemo(() => {
    return Object.entries(st.progress)
      .map(([id, p]) => ({ id, score: (p.wrong + 1) / (p.correct + 1), wrong: p.wrong, correct: p.correct }))
      .filter((w) => w.wrong + w.correct > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [now, st]);

  const dueTop = useMemo(() => {
    return Object.entries(st.progress)
      .map(([id, p]) => ({ id, wrong: p.wrong, correct: p.correct, due: !p.mastered && p.nextReviewAt <= now, nextReviewAt: p.nextReviewAt }))
      .filter((w) => w.due)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .slice(0, 10);
  }, [now, st]);

  const weakIdsText = useMemo(() => {
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
  }, [now, st]);

  const dueIdsText = useMemo(() => {
    const top = Object.entries(st.progress)
      .map(([id, p]) => ({ id, due: !p.mastered && p.nextReviewAt <= now, nextReviewAt: p.nextReviewAt }))
      .filter((w) => w.due)
      .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0))
      .slice(0, 50)
      .map((w) => w.id);

    return top.join('\n');
  }, [now, st]);

  const weakExportJson = useMemo(() => {
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
  }, [now, st]);

  const dueExportJson = useMemo(() => {
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
  }, [now, st]);

  const totalDue = useMemo(() => {
    return ALL_KANJI.filter((k) => {
      const p = st.progress[k.id];
      return p && !p.mastered && p.nextReviewAt <= now;
    }).length;
  }, [now, st]);

  const reviewLink = useMemo(() => {
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
  }, [now, st]);

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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">요약</h2>
            {summary.isLegacyNoDaily && (!legacyHintDismissed || forceLegacy) && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                style={{ background: 'rgba(250, 204, 21, 0.25)', color: 'rgba(161, 98, 7, 0.95)' }}
              >
                업데이트
              </span>
            )}
          </div>
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
            {summary.answered > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-extrabold" style={{ color: 'var(--muted)' }}>일별 문제 수</div>
                <MiniBarChart data={chartData} height={60} />
              </div>
            )}
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
            {summary.answered > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-extrabold" style={{ color: 'var(--muted)' }}>일별 정답률(%)</div>
                <MiniBarChart data={accChartData} height={60} barColor="var(--success, #22c55e)" highlightColor="var(--success-600, #16a34a)" />
              </div>
            )}
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

        {summary.isLegacyNoDaily && (!legacyHintDismissed || forceLegacy) && (
          <StateCard
            className="mt-3"
            icon="🧩"
            title="주간/월간 기록이 아직 없어"
            description="예전 버전에서 쌓인 누적 데이터만 있고, 오늘부터는 날짜별 기록도 같이 저장돼."
            hint="한 번만 풀면 다음부터 요약 카드가 채워져! (다시 보려면 /progress?legacy=1)"
            actions={[
              { label: '오늘 학습하러 가기', href: '/', variant: 'primary', testId: 'progress-legacy-start' },
              { label: '먼저 백업(내보내기)', href: '/progress/export', variant: 'ghost', testId: 'progress-legacy-export' },
              { label: '퀴즈로 기록 만들기', href: '/quiz/session', variant: 'ghost', testId: 'progress-legacy-quiz' },
              {
                label: '다시 보지 않기',
                variant: 'ghost',
                testId: 'progress-legacy-dismiss',
                onClick: () => {
                  window.localStorage.setItem(LEGACY_HINT_DISMISSED_KEY, '1');
                  setLegacyHintDismissed(true);
                  router.replace('/');
                },
              },
            ]}
          />
        )}

        {summary.isEmpty && (
          <StateCard
            className="mt-3"
            icon="🌱"
            title="진도가 비어 있어"
            description="홈에서 오늘의 학습을 시작하고, 퀴즈를 몇 문제 풀면 여기에 주간/월간 요약이 잡혀."
            actions={[{ label: '홈에서 시작하기', href: '/', variant: 'primary', testId: 'progress-empty-start' }]}
            hint="학습 → 퀴즈 → 진도 순서로 보면 가장 빨리 채워져!"
          />
        )}
      </section>

      <section className="mt-4 space-y-2">
        {rows.map((r) => (
          <GradeRow key={r.label} {...r} state={st} dailyCount={st.settings.dailyCount} />
        ))}
      </section>

      <section className="card mt-4 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            복습 대기: <span className="font-semibold">{totalDue}</span>개
          </div>
          <Link
            href={totalDue > 0 ? reviewLink : '#'}
            data-testid="progress-review-start"
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
          <Link
            className="btn btn-primary focus-ring inline-flex items-center justify-center px-3 py-2 text-xs"
            href="/progress/export"
          >
            내보내기
          </Link>
        </div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          약점ID/dueID/JSON 내보내기는 “내보내기”에서 4단계로 할 수 있어.
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
          <summary className="text-xs text-gray-500">(고급/레거시) 예전 방식 내보내기 텍스트</summary>
          <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            아래는 길게 눌러서 복사할 수 있어. (텔레그램 길이 대응용 ID 포함)
          </div>
          <pre className="mt-2 max-h-40 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">{weakIdsText}</pre>
          <pre className="mt-2 max-h-40 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">{dueIdsText}</pre>
          <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">{weakExportJson}</pre>
          <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-white/60 p-3 text-[11px] leading-relaxed">{dueExportJson}</pre>
        </details>
      </section>
    </main>
  );
}

function GradeRow(props: {
  label: GradeLabel;
  total: number;
  seen: number;
  mastered: number;
  due: number;
  state: AppState;
  dailyCount: 5 | 10 | 15;
}) {
  const { label, total, seen, mastered, due, state, dailyCount } = props;
  const pct = total ? Math.round((mastered / total) * 100) : 0;

  const weakInGrade = useMemo(() => {
    const items = kanjiByGradeLabel(label);
    const scored = items
      .filter((k) => !!state.progress[k.id])
      .map((k) => {
        const p = state.progress[k.id];
        const score = (p.wrong + 1) / (p.correct + 1);
        return { k, p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored;
  }, [label, state]);

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
              href={`/study?grade=${encodeURIComponent(label)}&n=${Math.min(10, dailyCount)}&focus=weak`}
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
