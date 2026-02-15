import type { KanjiProgress } from './types';

export function initialProgress(now: number): KanjiProgress {
  return {
    correct: 0,
    wrong: 0,
    consecutiveCorrect: 0,
    nextReviewAt: now,
    mastered: false,
  };
}

export function applyAnswer(
  prev: KanjiProgress,
  isCorrect: boolean,
  now: number,
  opts?: { gradeLabel?: string }
): KanjiProgress {
  let correct = prev.correct;
  let wrong = prev.wrong;
  let consecutiveCorrect = prev.consecutiveCorrect;
  let nextReviewAt = prev.nextReviewAt;
  let mastered = !!prev.mastered;

  const isHard = opts?.gradeLabel === '4급' || opts?.gradeLabel === '4급Ⅱ';

  const day = 24 * 60 * 60 * 1000;
  const d1 = 1 * day;
  const d2 = isHard ? 2 * day : 3 * day;
  const d3 = isHard ? 5 * day : 7 * day;
  const dMaster = isHard ? 21 * day : 30 * day;

  if (isCorrect) {
    correct += 1;
    consecutiveCorrect += 1;
    if (consecutiveCorrect >= 4) {
      mastered = true;
      nextReviewAt = now + dMaster;
    } else if (consecutiveCorrect >= 2) {
      nextReviewAt = now + d3;
    } else {
      nextReviewAt = now + d2;
    }
  } else {
    wrong += 1;
    consecutiveCorrect = 0;
    mastered = false;
    nextReviewAt = now + d1;
  }

  return { correct, wrong, consecutiveCorrect, nextReviewAt, mastered };
}
