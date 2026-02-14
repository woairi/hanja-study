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
      <main className="mx-auto max-w-md p-4">
        <h1 className="text-xl font-bold">퀴즈 결과</h1>
        <p className="mt-2 text-sm text-gray-700">
          점수: <span className="font-semibold">{score}</span> / {questions.length}
        </p>
        <div className="mt-4 flex gap-2">
          <Link className="flex-1 rounded border px-4 py-2 text-center" href="/">
            홈
          </Link>
          <Link className="flex-1 rounded bg-blue-600 px-4 py-2 text-center text-white" href="/progress">
            진도
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-600 underline" href="/">
          ← 홈
        </Link>
        <div className="text-sm text-gray-600">
          {qIdx + 1}/{questions.length}
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="text-sm text-gray-500">
          {q.kind === 'trap' ? '함정문제' : q.kind === 'meaning' ? '뜻' : '음'}
        </div>
        <div className="mt-2 text-lg font-semibold">{q.prompt}</div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {q.options.map((o) => {
            const selected = chosen === o.value;
            const isCorrectOption = feedback && o.value === q.answer;
            const isWrongPicked = feedback && selected && o.value !== q.answer;
            return (
              <button
                key={o.value}
                disabled={locked}
                className={`rounded border px-3 py-3 text-left transition-colors disabled:opacity-100 ${
                  selected ? 'border-blue-600 bg-blue-50' : ''
                } ${isCorrectOption ? 'border-green-600 bg-green-50' : ''} ${
                  isWrongPicked ? 'border-red-600 bg-red-50' : ''
                }`}
                onClick={() => setChosen(o.value)}
              >
                {o.text}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`mt-3 rounded-md px-3 py-2 text-sm ${feedback.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {feedback.correct ? '정답!' : `오답. 정답: ${feedback.answer}`}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 rounded border px-4 py-2"
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
          className="flex-1 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={!chosen || locked}
          onClick={() => {
            if (!q || !chosen) return;
            const isCorrect = chosen === q.answer;
            setLocked(true);
            setFeedback({ correct: isCorrect, answer: q.answer });
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

      <div className="mt-3 text-xs text-gray-500">정답/오답은 자동으로 복습 일정에 반영돼.</div>
    </main>
  );
}
