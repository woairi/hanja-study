'use client';

import type { GradeLabel } from './types';

export const QUIZ_RESULT_KEY = 'hanja-study:quizResult';
export const QUIZ_RESULT_CACHE_KEY = 'hanja-study:quizResult:last';
export const QUIZ_RESULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
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

function isQuizResultPayload(v: unknown): v is QuizResultPayload {
  if (!v || typeof v !== 'object') return false;
  const p = v as Partial<QuizResultPayload>;
  return (
    p.version === 1 &&
    typeof p.quizId === 'string' &&
    typeof p.grade === 'string' &&
    typeof p.total === 'number' &&
    typeof p.score === 'number' &&
    Array.isArray(p.wrongKanjiIds) &&
    typeof p.xp === 'number' &&
    typeof p.finishedAt === 'number'
  );
}

function parsePayload(raw: string | null): QuizResultPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isQuizResultPayload(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isExpired(payload: QuizResultPayload, now = Date.now()) {
  return payload.finishedAt + QUIZ_RESULT_TTL_MS < now;
}

function clearExpired() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(QUIZ_RESULT_KEY);
  window.localStorage.removeItem(QUIZ_RESULT_CACHE_KEY);
}

export function saveQuizResult(payload: QuizResultPayload) {
  if (typeof window === 'undefined') return;
  const raw = JSON.stringify(payload);
  window.sessionStorage.setItem(QUIZ_RESULT_KEY, raw);
  window.localStorage.setItem(QUIZ_RESULT_CACHE_KEY, raw);
}

export function loadQuizResult(): QuizResultPayload | null {
  if (typeof window === 'undefined') return null;
  const now = Date.now();

  const sessionPayload = parsePayload(window.sessionStorage.getItem(QUIZ_RESULT_KEY));
  if (sessionPayload && !isExpired(sessionPayload, now)) {
    // keep local fallback in sync for direct hit / refresh on result page
    window.localStorage.setItem(QUIZ_RESULT_CACHE_KEY, JSON.stringify(sessionPayload));
    return sessionPayload;
  }

  const cachedPayload = parsePayload(window.localStorage.getItem(QUIZ_RESULT_CACHE_KEY));
  if (cachedPayload && !isExpired(cachedPayload, now)) {
    // restore in-tab state for downstream flows expecting session key
    window.sessionStorage.setItem(QUIZ_RESULT_KEY, JSON.stringify(cachedPayload));
    return cachedPayload;
  }

  clearExpired();
  return null;
}

export function calcQuizXp(score: number, total: number) {
  const base = Math.max(0, score) * 10;
  const bonus = total > 0 && score === total ? 20 : 0;
  return base + bonus;
}
