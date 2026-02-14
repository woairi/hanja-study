'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ALL_KANJI, kanjiByGradeLabel } from '@/lib/kanji';
import type { GradeLabel, KanjiItem } from '@/lib/types';
import { loadState, saveState } from '@/lib/storage';
import { applyAnswer } from '@/lib/srs';
import { makeQuiz, type QuizQuestion } from '@/lib/quiz';

type StudySession = {
  gradeLabel: GradeLabel;
  n: number;
  itemIds: string[];
  startedAt: number;
};

const SESSION_KEY = 'hanja-study:session';

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

  useEffect(() => {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw) as StudySession;

    const items: KanjiItem[] = session.itemIds
      .map((id) => ALL_KANJI.find((k) => k.id === id))
      .filter((x): x is KanjiItem => !!x);

    const pool = kanjiByGradeLabel(session.gradeLabel);
    setQuestions(makeQuiz(items, pool));
    setQIdx(0);
    setChosen(null);
    setLocked(false);
    setFeedback(null);
    setAnswers([]);
  }, [grade]);

  const q = questions[qIdx];
  const done = questions.length > 0 && qIdx >= questions.length;

  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);

  function commitResult(isCorrect: boolean, kanjiId: string) {
    const now = Date.now();
    const st = loadState();
    const prev = st.progress[kanjiId];
    if (!prev) return;
    st.progress[kanjiId] = applyAnswer(prev, isCorrect, now);
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
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
        <div className="card w-full p-6">
          <div className="text-4xl">🏁</div>
          <h1 className="mt-2 text-2xl font-extrabold">퀴즈 끝!</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            점수: <span className="font-extrabold">{score}</span> / {questions.length}
          </p>
          <div className="mt-5 flex flex-col gap-2">
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
              }
              setAnswers((a) => [...a, { qid: q.id, correct: isCorrect, kanjiId: q.kanjiId }]);
              commitResult(isCorrect, q.kanjiId);

              window.setTimeout(() => {
                setFeedback(null);
                setLocked(false);
                setChosen(null);
                setQIdx((i) => i + 1);
              }, 700);
            }}
          >
            확인
          </button>
        </div>
      </div>
    </main>
  );
}
