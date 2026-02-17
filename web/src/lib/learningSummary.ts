'use client';

import type { AppState, KanjiItem } from './types';

/** 약점 점수: 오답 비율 (높을수록 약함) */
export function weakScore(wrong: number, correct: number): number {
  return (wrong + 1) / (correct + 1);
}

/** 복습 대기 여부 */
export function isDue(p: { mastered?: boolean; nextReviewAt: number }, now: number): boolean {
  return !!p && !p.mastered && p.nextReviewAt <= now;
}

export type WeakItem = {
  id: string;
  score: number;
  wrong: number;
  correct: number;
};

/** 취약 TOP N (오답 기반) */
export function getWeakTop(progress: AppState['progress'], limit = 10): WeakItem[] {
  return Object.entries(progress)
    .map(([id, p]) => ({
      id,
      score: weakScore(p.wrong, p.correct),
      wrong: p.wrong,
      correct: p.correct,
    }))
    .filter((w) => w.wrong + w.correct > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type DueItem = {
  id: string;
  wrong: number;
  correct: number;
  nextReviewAt: number;
};

/** 복습 대기 TOP N */
export function getDueTop(progress: AppState['progress'], now: number, limit = 10): DueItem[] {
  return Object.entries(progress)
    .filter(([, p]) => isDue(p, now))
    .map(([id, p]) => ({
      id,
      wrong: p.wrong,
      correct: p.correct,
      nextReviewAt: p.nextReviewAt,
    }))
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    .slice(0, limit);
}

/** 급수별 진도 통계 */
export function gradeStats(
  items: KanjiItem[],
  progress: AppState['progress'],
  now: number,
) {
  const seen = items.filter((k) => !!progress[k.id]).length;
  const mastered = items.filter((k) => progress[k.id]?.mastered).length;
  const due = items.filter((k) => {
    const p = progress[k.id];
    return p && isDue(p, now);
  }).length;
  const pct = items.length > 0 ? Math.round((mastered / items.length) * 100) : 0;
  return { total: items.length, seen, mastered, due, pct };
}

/** 기간별 학습 요약 (주간/월간) */
export function periodSummary(
  stats: AppState['stats'],
  now: number,
  days: number,
) {
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
    const day = stats.daily?.[k];
    if (!day) continue;
    answered += day.answered || 0;
    correct += day.correct || 0;
    wrong += day.wrong || 0;
    if ((day.answered || 0) > 0) studyDays += 1;
  }

  const acc = answered > 0 ? Math.round((correct / answered) * 100) : null;

  return { days, studyDays, answered, correct, wrong, acc };
}

/** 일별 미션 추천: 복습 대기 우선 → 약점 → 신규 */
export function dailyMissionItems(
  gradeItems: KanjiItem[],
  progress: AppState['progress'],
  now: number,
  count: number,
): { items: KanjiItem[]; composition: { review: number; weak: number; fresh: number } } {
  const result: KanjiItem[] = [];
  const used = new Set<string>();

  // 1) 복습 대기 (최대 40%)
  const reviewMax = Math.ceil(count * 0.4);
  const dueIds = getDueTop(progress, now, reviewMax);
  for (const d of dueIds) {
    const k = gradeItems.find((x) => x.id === d.id);
    if (k && !used.has(k.id)) {
      result.push(k);
      used.add(k.id);
    }
  }
  const reviewCount = result.length;

  // 2) 약점 (최대 30%)
  const weakMax = Math.ceil(count * 0.3);
  const weakIds = getWeakTop(progress, weakMax + 5);
  for (const w of weakIds) {
    if (result.length >= count) break;
    if (used.has(w.id)) continue;
    const k = gradeItems.find((x) => x.id === w.id);
    if (k) {
      result.push(k);
      used.add(k.id);
    }
  }
  const weakCount = result.length - reviewCount;

  // 3) 나머지는 신규 (아직 안 본 한자)
  const unseen = gradeItems.filter((k) => !progress[k.id] && !used.has(k.id));
  for (const k of unseen) {
    if (result.length >= count) break;
    result.push(k);
    used.add(k.id);
  }
  const freshCount = result.length - reviewCount - weakCount;

  return {
    items: result.slice(0, count),
    composition: { review: reviewCount, weak: weakCount, fresh: freshCount },
  };
}
