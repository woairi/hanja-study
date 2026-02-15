'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ALL_KANJI, kanjiByGradeLabel } from '@/lib/kanji';
import type { GradeLabel, KanjiItem } from '@/lib/types';
import { loadState, saveState } from '@/lib/storage';
import { applyAnswer } from '@/lib/srs';
import { makeQuiz, type QuizQuestion } from '@/lib/quiz';
import { makeRetryQuestion } from '@/lib/retry';
import { loadLastSession, saveLastSession, clearLastSession } from '@/lib/session';

type StudySession = {
  gradeLabel: GradeLabel;
  n: 5 | 10 | 15;
  itemIds: string[];
  startedAt: number;
};

const SESSION_KEY = 'hanja-study:session';
const RETRY_KEY = 'hanja-study:retry';

export default function QuizClient() {
  const sp = useSearchParams();
  const grade = (sp.get('grade') || '8급') as GradeLabel;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [answers, setAnswers] = useState<{ qid: string; correct: boolean; kanjiId: string }[]>([]);
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
      setAnswers([]);
      setPendingRetry([]);
      // no resume state for retry
      return;
    }

    const raw = window.sessionStorage.getItem(SESSION_KEY);
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
  }, [grade, sp]);

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

  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);
  const wrongKanjiIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of answers) {
      if (!a.correct) set.add(a.kanjiId);
    }
    return [...set];
  }, [answers]);

  function commitResult(isCorrect: boolean, kanjiId: string) {
    const now = Date.now();
    const st = loadState();
    const prev = st.progress[kanjiId];
    if (!prev) return;
    const k = ALL_KANJI.find((x) => x.id === kanjiId);
    st.progress[kanjiId] = applyAnswer(prev, isCorrect, now, { gradeLabel: k?.gradeLabel });
    st.stats.quizAnswered = (st.stats.quizAnswered || 0) + 1;
    saveState(st);
  }

  if (!questions.length) {
    return (
      <main className="mx-auto max-w-md p-4">
        <div className="text-sm text-gray-600">퀴즈 준비중…</div>
      </main>
    );
  }

  if (done) {
    // finished → clear resume marker
    clearLastSession();

    const hasWrong = wrongKanjiIds.length > 0;
    const st = loadState();
    const streakCount = st.streak.count;
    const quizAnswered = st.stats?.quizAnswered || 0;

    const achieved = {
      first: Object.keys(st.progress || {}).length > 0,
      streak3: streakCount >= 3,
      streak7: streakCount >= 7,
      quiz50: quizAnswered >= 50,
    };

    const nextBadgeHint = (() => {
      if (!achieved.streak3) return `다음 뱃지: ⭐ 연속 3일 (${streakCount}/3)`;
      if (!achieved.streak7) return `다음 뱃지: 🌈 연속 7일 (${streakCount}/7)`;
      if (!achieved.quiz50) return `다음 뱃지: 🏅 퀴즈 50문제 (${quizAnswered}/50)`;
      return '모든 뱃지를 모았어! 🎉';
    })();

    const now = Date.now();
    const dueCountInGrade = kanjiByGradeLabel(grade).filter((k) => {
      const p = st.progress[k.id];
      return p && !p.mastered && p.nextReviewAt <= now;
    }).length;

    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
        <div className="card w-full p-6">
          <div className="text-4xl">🏁</div>
          <h1 className="mt-2 text-2xl font-extrabold">퀴즈 끝!</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            점수: <span className="font-extrabold">{score}</span> / {questions.length}
          </p>
          {hasWrong && (
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              틀린 문제: <span className="font-extrabold">{wrongKanjiIds.length}</span>개
            </p>
          )}

          <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-left text-sm">
            <div className="font-extrabold">오늘의 성과</div>
            <div className="mt-1" style={{ color: 'var(--muted)' }}>
              🔥 연속 {streakCount}일
            </div>
            <div className="mt-1" style={{ color: 'var(--muted)' }}>
              {nextBadgeHint}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {hasWrong && (
              <Link
                className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
                href={`/quiz?grade=${encodeURIComponent(grade)}&retry=1`}
                onClick={() => {
                  window.sessionStorage.setItem(RETRY_KEY, JSON.stringify(wrongKanjiIds));
                }}
              >
                틀린 것만 다시
              </Link>
            )}

            {!hasWrong && dueCountInGrade > 0 && (
              <Link
                className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
                href={`/study?grade=${encodeURIComponent(grade)}&n=${10}&review=1`}
              >
                복습 {Math.min(10, dueCountInGrade)}개 더 하기
              </Link>
            )}

            <Link className="btn btn-primary focus-ring inline-flex w-full items-center justify-center" href="/progress">
              진도 보기
            </Link>
            <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/">
              홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100svh] max-w-md p-4 pb-28">
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

      <div className={`card p-4 ${feedback?.correct ? 'pop' : ''}`}>
        <div className="text-sm">
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-extrabold"
            style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--text)' }}
          >
            {q.kind === 'trap' ? '🪤 함정' : q.kind === 'meaning' ? '💡 뜻' : '🔊 음'}
          </span>
        </div>
        <div className="mt-3 text-xl font-extrabold">{q.prompt}</div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {q.options.map((o) => {
            const selected = chosen === o.value;
            const isCorrectOption = feedback && o.value === q.answer;
            const isWrongPicked = feedback && selected && o.value !== q.answer;
            return (
              <button
                key={o.value}
                disabled={locked}
                className={`focus-ring rounded-2xl border-2 px-4 py-4 text-left text-lg font-extrabold transition-colors disabled:opacity-100 ${
                  selected ? 'border-blue-600 bg-blue-50 pop' : ''
                } ${isCorrectOption ? 'border-green-600 bg-green-50' : ''} ${
                  isWrongPicked ? 'border-red-600 bg-red-50' : ''
                }`}
                style={{ borderColor: 'rgba(2,132,199,0.18)' }}
                onClick={() => setChosen(o.value)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{o.text}</span>
                  {selected && !feedback && <span aria-hidden className="text-xl">✅</span>}
                  {isCorrectOption && feedback && <span aria-hidden className="text-xl">✅</span>}
                  {isWrongPicked && feedback && <span aria-hidden className="text-xl">❌</span>}
                </div>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`mt-3 rounded-2xl px-3 py-2 text-sm font-bold ${
              feedback.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>{feedback.correct ? '정답!' : `오답. 정답: ${feedback.answer}`}</div>
              <div className="flex items-center gap-2">
                {feedback.correct && (
                  <>
                    <div key={confettiKey} className="confetti text-lg" aria-hidden>
                      🎉
                    </div>
                    <div key={sparkleKey} className="sparkle text-lg" aria-hidden>
                      ✨
                    </div>
                  </>
                )}
              </div>
            </div>
            {!feedback.correct && (
              <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                {(() => {
                  const k = ALL_KANJI.find((x) => x.id === q.kanjiId);
                  if (!k) return null;
                  return (
                    <span>
                      <span className="font-extrabold">{k.hanja}</span> = {k.meaning} {k.reading}
                      {k.exampleWord ? (
                        <>
                          <br />
                          <span>
                            예: <span className="font-extrabold">{k.exampleWord}</span>
                            {k.exampleMeaning ? ` · ${k.exampleMeaning}` : ''}
                          </span>
                        </>
                      ) : null}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
        정답/오답은 자동으로 복습 일정에 반영돼.
      </div>

      {/* bottom bar */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4">
        <div className="card flex gap-2 p-3">
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
            className="btn btn-primary focus-ring flex-1 disabled:opacity-50"
            disabled={!chosen || locked}
            onClick={() => {
              if (!q || !chosen) return;
              const isCorrect = chosen === q.answer;
              setLocked(true);
              setFeedback({ correct: isCorrect, answer: q.answer });
              if (isCorrect) {
                setConfettiKey((k) => k + 1);
                setSparkleKey((k) => k + 1);
              } else {
                // schedule one re-try after 3 more questions
                setPendingRetry((p) => [...p, { kanjiId: q.kanjiId, dueAt: qIdx + 4, kind: q.kind }]);
              }

              setAnswers((a) => [...a, { qid: q.id, correct: isCorrect, kanjiId: q.kanjiId }]);
              commitResult(isCorrect, q.kanjiId);

              const delayMs = isCorrect ? 1000 : 1700;
              window.setTimeout(() => {
                setFeedback(null);
                setLocked(false);
                setChosen(null);

                setQIdx((i) => {
                  const next = i + 1;
                  const raw = window.sessionStorage.getItem(SESSION_KEY);
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
        </div>
      </div>
    </main>
  );
}
