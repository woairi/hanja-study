'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { generateExam, type ExamQuestion, type ExamMode, type ExamType, examTypeLabel } from '@/lib/exam/generator';
import { loadState, saveState } from '@/lib/storage';
import { applyAnswer } from '@/lib/srs';
import { ALL_KANJI } from '@/lib/kanji';
import type { GradeLabel } from '@/lib/types';

const EXAM_RESULT_KEY = 'hanja-study:examResult';

export default function ExamSessionClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const grade = (sp.get('grade') || '8급') as GradeLabel;
  const mode = (sp.get('mode') || 'quick') as ExamMode;
  const typeFilter = sp.get('type') as ExamType | null;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ qid: string; correct: boolean; kanjiId: string; type: ExamType; chosen: string }[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const qs = generateExam(grade, mode, typeFilter || undefined);
    setQuestions(qs);
    setQIdx(0);
    setAnswers([]);
  }, [grade, mode, typeFilter]);

  const q = questions[qIdx];
  const done = qIdx >= questions.length && questions.length > 0;
  const progress = questions.length > 0 ? Math.round(((qIdx) / questions.length) * 100) : 0;

  // SRS 반영
  const commitResult = useCallback((isCorrect: boolean, kanjiId: string) => {
    const now = Date.now();
    const st = loadState();
    const prev = st.progress[kanjiId];
    if (!prev) return;
    const k = ALL_KANJI.find((x) => x.id === kanjiId);
    st.progress[kanjiId] = applyAnswer(prev, isCorrect, now, { gradeLabel: k?.gradeLabel });

    // 시험 통계
    const today = new Date().toISOString().slice(0, 10);
    if (!st.stats.daily) st.stats.daily = {};
    if (!st.stats.daily[today]) st.stats.daily[today] = { answered: 0, correct: 0, wrong: 0 };
    st.stats.daily[today].answered += 1;
    if (isCorrect) st.stats.daily[today].correct += 1;
    else st.stats.daily[today].wrong += 1;

    saveState(st);
  }, []);

  // 결과 저장 + 이동
  useEffect(() => {
    if (!done) return;
    const score = answers.filter((a) => a.correct).length;
    const total = answers.length;

    // 유형별 통계
    const byType: Record<string, { correct: number; total: number }> = {};
    for (const a of answers) {
      if (!byType[a.type]) byType[a.type] = { correct: 0, total: 0 };
      byType[a.type].total += 1;
      if (a.correct) byType[a.type].correct += 1;
    }

    const payload = {
      grade,
      mode,
      score,
      total,
      byType,
      wrongKanjiIds: answers.filter((a) => !a.correct).map((a) => a.kanjiId),
      finishedAt: Date.now(),
    };
    sessionStorage.setItem(EXAM_RESULT_KEY, JSON.stringify(payload));
    router.replace(`/exam/result?grade=${encodeURIComponent(grade)}`);
  }, [done, answers, grade, mode, router]);

  const handleAnswer = useCallback((value: string) => {
    if (!q || locked) return;
    setChosen(value);
    setLocked(true);

    const isCorrect = value === q.answer;
    setFeedback({ correct: isCorrect, answer: q.answer });
    setAnswers((a) => [...a, { qid: q.id, correct: isCorrect, kanjiId: q.kanjiId, type: q.type, chosen: value }]);
    commitResult(isCorrect, q.kanjiId);

    setTimeout(() => {
      setFeedback(null);
      setChosen(null);
      setLocked(false);
      setQIdx((i) => i + 1);
    }, isCorrect ? 500 : 800);
  }, [q, locked, commitResult]);

  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-md p-4 text-center">
        <div style={{ color: 'var(--muted)' }}>문제 준비 중...</div>
      </main>
    );
  }

  if (!q) return null;

  return (
    <main className="mx-auto max-w-md p-4">
      {/* 상단 진행바 */}
      <div className="mb-1 flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
        <Link href="/exam" className="text-blue-700 underline">← 나가기</Link>
        <span>{qIdx + 1} / {questions.length}</span>
      </div>
      <div className="mb-4 h-2 w-full rounded bg-gray-200">
        <div
          className="h-2 rounded transition-all"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-600))' }}
        />
      </div>

      {/* 유형 라벨 */}
      <div className="mb-1 text-xs font-extrabold" style={{ color: 'var(--primary)' }}>
        {examTypeLabel(q.type)}
      </div>

      {/* 문제 */}
      <Card className="p-5 text-center">
        <div className="text-4xl font-extrabold">{q.prompt}</div>
        {q.subtitle && (
          <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {q.subtitle}
          </div>
        )}
      </Card>

      {/* 선택지 */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {q.options.map((opt) => {
          const isChosen = chosen === opt.value;
          const showCorrect = feedback && opt.value === feedback.answer;
          const showWrong = feedback && isChosen && !feedback.correct;

          let bg = 'rgba(255,255,255,0.8)';
          let border = 'rgba(2,132,199,0.16)';
          if (showCorrect) { bg = 'rgba(34,197,94,0.15)'; border = 'rgba(34,197,94,0.5)'; }
          if (showWrong) { bg = 'rgba(239,68,68,0.12)'; border = 'rgba(239,68,68,0.5)'; }

          return (
            <button
              key={opt.value}
              className="focus-ring w-full rounded-2xl border-2 px-4 py-4 text-left text-lg font-extrabold transition-colors"
              style={{ background: bg, borderColor: border }}
              disabled={locked}
              onClick={() => handleAnswer(opt.value)}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* 피드백 */}
      {feedback && (
        <div className={`mt-3 rounded-xl px-4 py-2 text-center text-sm font-extrabold ${
          feedback.correct ? 'text-green-700' : 'text-red-600'
        }`} style={{ background: feedback.correct ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)' }}>
          {feedback.correct ? '정답! 🎉' : `오답 — 정답: ${feedback.answer}`}
        </div>
      )}
    </main>
  );
}
