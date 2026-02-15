'use client';

import type { GradeLabel } from './types';

export const QUIZ_RESULT_KEY = 'hanja-study:quizResult';
export const QUIZ_RETRY_KEY = 'hanja-study:retry';

export type QuizResultPayload = {
  version: 1;
  quizId: string;
  grade: GradeLabel;
  total: number;
  score: number;
  wrongKanjiIds: string[];
  xp: number;
  finishedAt: number;
};

export function saveQuizResult(payload: QuizResultPayload) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(QUIZ_RESULT_KEY, JSON.stringify(payload));
}

export function loadQuizResult(): QuizResultPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(QUIZ_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizResultPayload;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function calcQuizXp(score: number, total: number) {
  const base = Math.max(0, score) * 10;
  const bonus = total > 0 && score === total ? 20 : 0;
  return base + bonus;
}
