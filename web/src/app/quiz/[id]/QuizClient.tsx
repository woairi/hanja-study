'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { InstantFeedback } from '@/components/quiz/InstantFeedback';
import { ALL_KANJI, kanjiByGradeLabel } from '@/lib/kanji';
import type { GradeLabel, KanjiItem } from '@/lib/types';
import { bumpDailyQuizStats, loadState, saveState } from '@/lib/storage';
import { applyAnswer } from '@/lib/srs';
import { makeQuiz, type QuizQuestion } from '@/lib/quiz';
import { makeRetryQuestion } from '@/lib/retry';
import { loadLastSession, saveLastSession, clearLastSession } from '@/lib/session';
import { logEvent } from '@/lib/telemetry';
import { calcQuizXp, saveQuizResult } from '@/lib/quizResult';

type StudySession = {
  gradeLabel: GradeLabel;
  n: 5 | 10 | 15;
  itemIds: string[];
  startedAt: number;
};

const LEGACY_SESSION_KEY = 'hanja-study:session';
const RETRY_KEY = 'hanja-study:retry';

function sessionKey(quizId: string) {
  return `hanja-study:session:${quizId}`;
}

export default function QuizClient() {
  const sp = useSearchParams();
  const params = useParams<{ id: string }>();
  const quizId = params?.id || 'session';
  const grade = (sp.get('grade') || '8급') as GradeLabel;

  const router = useRouter();
  const [didFinishRedirect, setDidFinishRedirect] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string; hintUsed: boolean; streak: number } | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintEliminated, setHintEliminated] = useState<string[]>([]);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [answers, setAnswers] = useState<{ qid: string; correct: boolean; hintUsed: boolean; kanjiId: string }[]>([]);
  const [pendingRetry, setPendingRetry] = useState<Array<{ kanjiId: string; dueAt: number; kind: QuizQuestion['kind'] }>>([]);

  useEffect(() => {
    const retry = sp.get('retry') === '1';
    if (retry) {
      const rawRetry = window.sessionStorage.getItem(RETRY_KEY);
      if (!rawRetry) return;
      const retryIds = JSON.parse(rawRetry) as string[];
      const items: KanjiItem[] = retryIds
        .map((id) => ALL_KANJI.find((k) => k.id === id))
        .filter((x): x is KanjiItem => !!x);
      const pool = kanjiByGradeLabel(grade);
      setQuestions(makeQuiz(items, pool));
      setQIdx(0);
      setChosen(null);
      setLocked(false);
      setFeedback(null);
      setHintUsed(false);
      setHintEliminated([]);
      setSessionStreak(0);
      setAnswers([]);
      setPendingRetry([]);
      // no resume state for retry
      return;
    }

    const raw = window.sessionStorage.getItem(sessionKey(quizId)) || window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw) as StudySession;

    const items: KanjiItem[] = session.itemIds
      .map((id) => ALL_KANJI.find((k) => k.id === id))
      .filter((x): x is KanjiItem => !!x);

    const pool = kanjiByGradeLabel(session.gradeLabel);
    setQuestions(makeQuiz(items, pool));

    const last = loadLastSession();
    const wantResume = sp.get('resume') === '1';
    const startQ = wantResume && last && last.mode === 'quiz' && last.gradeLabel === session.gradeLabel && last.n === session.n ? last.qIdx : 0;

    setQIdx(startQ);
    setChosen(null);
    setLocked(false);
    setFeedback(null);
    setHintUsed(false);
    setHintEliminated([]);
    setSessionStreak(0);
    setAnswers([]);
    setPendingRetry([]);

    saveLastSession({
      version: 1,
      mode: 'quiz',
      gradeLabel: session.gradeLabel,
      n: session.n,
      itemIds: session.itemIds,
      qIdx: startQ,
      startedAt: last && last.mode === 'quiz' ? last.startedAt : Date.now(),
      updatedAt: Date.now(),
    });
  }, [grade, sp, quizId]);

  // If any scheduled retry is due at current index, insert it *before* rendering this index.
  useEffect(() => {
    const due = pendingRetry.filter((r) => r.dueAt === qIdx);
    if (!due.length) return;

    setQuestions((prevQs) => {
      const pool = kanjiByGradeLabel(grade);
      const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));
      const inserts = due
        .map((r) => map.get(r.kanjiId))
        .filter((x): x is KanjiItem => !!x)
        .map((k) => {
          const qq = makeRetryQuestion(k, pool);
          return { ...qq, id: `retry-${k.id}-${Date.now()}`, kanjiId: k.id };
        });

      if (!inserts.length) return prevQs;
      const next = [...prevQs];
      next.splice(qIdx, 0, ...inserts);
      return next;
    });

    setPendingRetry((p) => p.filter((r) => r.dueAt !== qIdx));
  }, [qIdx, pendingRetry, grade]);

  const q = questions[qIdx];
  const done = questions.length > 0 && qIdx >= questions.length;
  useEffect(() => {
    // Per-question UI state should reset on navigation.
    setHintUsed(false);
    setHintEliminated([]);
  }, [qIdx]);

  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);
  const wrongKanjiIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of answers) {
      if (!a.correct) set.add(a.kanjiId);
    }
    return [...set];
  }, [answers]);



  useEffect(() => {
    if (!done || didFinishRedirect) return;

    // finished → clear resume marker + go to summary screen
    clearLastSession();

    const total = questions.length;
    const xp = calcQuizXp(score, total);
    saveQuizResult({
      version: 1,
      quizId,
      grade,
      total,
      score,
      wrongKanjiIds,
      xp,
      finishedAt: Date.now(),
    });

    logEvent('quiz_done', { grade, score, total });
    setDidFinishRedirect(true);
    router.replace(`/quiz/result?grade=${encodeURIComponent(grade)}&quizId=${encodeURIComponent(quizId)}`);
  }, [done, didFinishRedirect, grade, quizId, questions.length, router, score, wrongKanjiIds]);

  function commitResult(isCorrect: boolean, kanjiId: string) {
    const now = Date.now();
    let st = loadState();
    const prev = st.progress[kanjiId];
    if (!prev) return;
    const k = ALL_KANJI.find((x) => x.id === kanjiId);
    st.progress[kanjiId] = applyAnswer(prev, isCorrect, now, { gradeLabel: k?.gradeLabel });
    st.stats.quizAnswered = (st.stats.quizAnswered || 0) + 1;
    st = bumpDailyQuizStats(st, { at: now, correct: isCorrect });
    saveState(st);
  }

  if (!questions.length) {
    return (
      <main className="mx-auto min-h-[100svh] max-w-md p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        <Card className="p-4">
          <div className="animate-pulse">
            <div className="h-6 w-24 rounded-full bg-gray-200" />
            <div className="mt-3 h-7 w-3/4 rounded bg-gray-200" />
            <div className="mt-4 space-y-2">
              <div className="h-14 rounded-2xl bg-gray-200" />
              <div className="h-14 rounded-2xl bg-gray-200" />
              <div className="h-14 rounded-2xl bg-gray-200" />
              <div className="h-14 rounded-2xl bg-gray-200" />
            </div>
            <div className="mt-3 h-16 rounded-2xl bg-gray-100" />
          </div>
        </Card>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
        <Card className="w-full p-6">
          <div className="text-4xl">🏁</div>
          <h1 className="mt-2 text-2xl font-extrabold">결과 정리중…</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            잠깐만! 결과 화면으로 이동할게.
          </p>
          <Link className="btn btn-ghost focus-ring mt-4 inline-flex w-full items-center justify-center" href="/">
            홈으로
          </Link>
        </Card>
      </main>
    );
  }


  return (
    <main className="mx-auto min-h-[100svh] max-w-md p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-700 underline" href="/">
          ← 홈
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          {qIdx + 1}/{questions.length}
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2 w-full rounded-full bg-white/60">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${Math.round(((qIdx + 1) / questions.length) * 100)}%`,
              background: 'linear-gradient(180deg, var(--primary), var(--primary-600))',
            }}
          />
        </div>
      </div>

      <Card className={`p-4 ${feedback?.correct ? 'pop' : ''}`}>
        <div className="text-sm">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-extrabold"
            style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--text)' }}
          >
            {q.kind === 'trap' ? '🪤 함정' : q.kind === 'meaning' ? '💡 뜻' : '🔊 음'}
          </span>
        </div>
        <div className="mt-3 min-h-[3.25rem] text-xl font-extrabold leading-snug break-words">{q.prompt}</div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {q.options.map((o) => {
            const selected = chosen === o.value;
            const eliminated = !feedback && hintEliminated.includes(o.value);
            const isCorrectOption = feedback && o.value === q.answer;
            const isWrongPicked = feedback && selected && o.value !== q.answer;
            return (
              <button
                key={o.value}
                disabled={locked || (!feedback && eliminated)}
                className={`focus-ring rounded-2xl border-2 px-4 py-4 text-left text-lg font-extrabold transition-colors disabled:opacity-100 ${
                  selected ? 'border-blue-600 bg-blue-50 pop' : ''
                } ${isCorrectOption ? 'border-green-600 bg-green-50' : ''} ${
                  isWrongPicked ? 'border-red-600 bg-red-50' : ''
                } ${eliminated ? 'opacity-40' : ''}`}
                style={{ borderColor: 'rgba(2,132,199,0.18)' }}
                onClick={() => {
                  if (eliminated) return;
                  setChosen(o.value);
                }}
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 whitespace-normal break-words">{o.text}</span>
                  {selected && !feedback && <span aria-hidden className="text-xl">✅</span>}
                  {isCorrectOption && feedback && <span aria-hidden className="text-xl">✅</span>}
                  {isWrongPicked && feedback && <span aria-hidden className="text-xl">❌</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 min-h-[6.5rem]">
          {feedback ? (
            <InstantFeedback
              tone={feedback.correct ? 'correct' : 'wrong'}
              title={feedback.correct ? '정답!' : `아깝다! 정답은 ${String(feedback.answer)}`}
              meta={(() => {
                const parts = [feedback.hintUsed ? '힌트' : null, feedback.streak >= 2 ? `연속 ${feedback.streak}` : null].filter(
                  Boolean
                ) as string[];
                return parts.length ? parts.join(' · ') : undefined;
              })()}
              celebrate={feedback.correct}
              confettiKey={confettiKey}
              sparkleKey={sparkleKey}
            >
              {(() => {
                const k = ALL_KANJI.find((x) => x.id === q.kanjiId);
                if (!k) return null;
                const conf = (k.confusables || []).slice(0, 4).join(' ');

                if (feedback.correct) {
                  return (
                    <div className="text-xs">
                      <div>
                        <span className="font-extrabold">{k.hanja}</span> = {k.meaning} {k.reading}
                      </div>
                      {k.exampleWord ? (
                        <div className="mt-1">
                          예: <span className="font-extrabold">{k.exampleWord}</span>
                        </div>
                      ) : null}
                      {q.kind === 'trap' && conf ? (
                        <div className="mt-1">
                          헷갈리기: <span className="font-extrabold">{conf}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div>
                    <div>
                      <span className="font-extrabold">{k.hanja}</span> = {k.meaning} {k.reading}
                    </div>
                    {k.exampleWord ? (
                      <div className="mt-1">
                        예: <span className="font-extrabold">{k.exampleWord}</span>
                        {k.exampleMeaning ? ` · ${k.exampleMeaning}` : ''}
                      </div>
                    ) : null}
                    {q.kind === 'trap' && conf ? (
                      <div className="mt-1">
                        헷갈리기: <span className="font-extrabold">{conf}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </InstantFeedback>
          ) : (
            <div aria-hidden />
          )}
        </div>
      </Card>

      <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
        정답/오답은 자동으로 복습 일정에 반영돼.
      </div>

      {/* bottom bar */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Card className="flex gap-2 p-3">
          <button
            className="btn btn-ghost focus-ring flex-1"
            onClick={() => {
              if (locked) return;
              setChosen(null);
              setQIdx((i) => Math.max(0, i - 1));
            }}
            disabled={qIdx === 0 || locked}
          >
            이전
          </button>

          <button
            className="btn btn-ghost focus-ring flex-1"
            disabled={locked || !!feedback || hintUsed}
            onClick={() => {
              if (!q || locked || feedback || hintUsed) return;

              const wrong = q.options
                .map((o) => o.value)
                .filter((v) => v !== q.answer)
                .filter((v) => v !== chosen);

              // Keep at least 2 choices available.
              const need = Math.max(1, q.options.length - 2);
              const picked: string[] = [];
              for (const v of wrong.sort(() => Math.random() - 0.5)) {
                if (picked.length >= need) break;
                picked.push(v);
              }

              if (!picked.length) return;
              setHintUsed(true);
              setHintEliminated(picked);
              logEvent('quiz_hint_use', { grade, kind: q.kind });
            }}
          >
            힌트
          </button>

          <button
            className="btn btn-primary focus-ring flex-1 disabled:opacity-50"
            disabled={!chosen || locked}
            onClick={() => {
              if (!q || !chosen) return;
              const isCorrect = chosen === q.answer;
              const nextStreak = isCorrect ? sessionStreak + 1 : 0;

              setLocked(true);
              setSessionStreak(nextStreak);
              setFeedback({ correct: isCorrect, answer: q.answer, hintUsed, streak: nextStreak });

              if (isCorrect) {
                setConfettiKey((k) => k + 1);
                setSparkleKey((k) => k + 1);
              } else {
                // schedule one re-try after 3 more questions
                setPendingRetry((p) => [...p, { kanjiId: q.kanjiId, dueAt: qIdx + 4, kind: q.kind }]);
              }

              setAnswers((a) => [...a, { qid: q.id, correct: isCorrect, hintUsed, kanjiId: q.kanjiId }]);
              commitResult(isCorrect, q.kanjiId);

              const delayMs = isCorrect ? 650 : 800;
              window.setTimeout(() => {
                setFeedback(null);
                setLocked(false);
                setChosen(null);

                setQIdx((i) => {
                  const next = i + 1;
                  const raw = window.sessionStorage.getItem(sessionKey(quizId)) || window.sessionStorage.getItem(LEGACY_SESSION_KEY);
                  if (raw) {
                    const session = JSON.parse(raw) as StudySession;
                    const now = Date.now();
                    saveLastSession({
                      version: 1,
                      mode: 'quiz',
                      gradeLabel: session.gradeLabel,
                      n: session.n,
                      itemIds: session.itemIds,
                      qIdx: next,
                      startedAt: (() => {
                        const prev = loadLastSession();
                        return prev && prev.mode === 'quiz' ? prev.startedAt : now;
                      })(),
                      updatedAt: now,
                    });
                  }
                  return next;
                });
              }, delayMs);
            }}
          >
            확인
          </button>
        </Card>
      </div>
    </main>
  );
}
