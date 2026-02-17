'use client';

import type { GradeLabel, KanjiItem } from './types';

export const QUIZ_RESULT_KEY = 'hanja-study:quizResult';

/** 오답 이유 분류: 정답 한자와 선택한 한자 비교 */
export function classifyWrongReason(correct: KanjiItem, chosen: KanjiItem | undefined): WrongReason {
  if (!chosen) return 'unknown';
  // 같은 음 → 음 혼동
  if (correct.reading === chosen.reading) return 'reading';
  // 같은 뜻 → 뜻 혼동
  if (correct.meaning === chosen.meaning) return 'meaning';
  // confusables에 포함 → 형태 혼동
  if (correct.confusables?.includes(chosen.hanja) || chosen.confusables?.includes(correct.hanja)) return 'shape';
  return 'unknown';
}

/** 오답 이유별 코칭 메시지 (랜덤 선택) */
const readingTips = [
  '같은 소리(음)의 한자와 헷갈렸어. 뜻을 함께 외우면 구분이 쉬워져!',
  '음이 같은 한자는 뜻으로 구분해봐! 예시 단어를 떠올리면 도움이 돼.',
  '소리가 같아도 뜻이 다르잖아! 예시 단어와 함께 기억해봐.',
];
const meaningTips = [
  '비슷한 뜻의 한자와 헷갈렸어. 음(소리)으로 구분해봐!',
  '뜻이 비슷할 땐 부수(部首)를 보면 힌트가 있어!',
  '비슷한 뜻이지만 쓰임이 달라. 예시 단어를 비교해봐!',
];
const shapeTips = [
  '모양이 비슷한 한자와 헷갈렸어. 부수(部首)를 자세히 보면 차이가 보여!',
  '비슷하게 생겼지만 부수가 달라! 부수의 뜻을 알면 구분이 쉬워져.',
  '모양이 비슷할 땐 획수를 세어봐. 작은 차이가 큰 차이야!',
];
const unknownTips = [
  '다시 한번 보면 기억에 남을 거야!',
  '틀려도 괜찮아! 한 번 더 보면 다음엔 맞힐 수 있어.',
  '실수는 배움의 시작이야! 예시 단어를 읽어보면 도움이 돼.',
  '오답 노트에 적어두면 복습할 때 좋아!',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function wrongReasonCoaching(reason: WrongReason): string {
  switch (reason) {
    case 'reading':
      return pick(readingTips);
    case 'meaning':
      return pick(meaningTips);
    case 'shape':
      return pick(shapeTips);
    default:
      return pick(unknownTips);
  }
}
export const QUIZ_RESULT_CACHE_KEY = 'hanja-study:quizResult:last';
export const QUIZ_RESULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const QUIZ_RETRY_KEY = 'hanja-study:retry';

export type WrongReason = 'meaning' | 'reading' | 'shape' | 'unknown';

export type WrongDetail = {
  kanjiId: string;
  chosenId?: string;
  reason: WrongReason;
};

export type QuizResultPayload = {
  version: 1;
  quizId: string;
  grade: GradeLabel;
  total: number;
  score: number;
  wrongKanjiIds: string[];
  wrongDetails?: WrongDetail[];
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
