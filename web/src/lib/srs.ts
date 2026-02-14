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

export function applyAnswer(prev: KanjiProgress, isCorrect: boolean, now: number): KanjiProgress {
  let correct = prev.correct;
  let wrong = prev.wrong;
  let consecutiveCorrect = prev.consecutiveCorrect;
  let nextReviewAt = prev.nextReviewAt;
  let mastered = !!prev.mastered;

  if (isCorrect) {
    correct += 1;
    consecutiveCorrect += 1;
    if (consecutiveCorrect >= 4) {
      mastered = true;
      nextReviewAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    } else if (consecutiveCorrect >= 2) {
      nextReviewAt = now + 7 * 24 * 60 * 60 * 1000;
    } else {
      nextReviewAt = now + 3 * 24 * 60 * 60 * 1000;
    }
  } else {
    wrong += 1;
    consecutiveCorrect = 0;
    mastered = false;
    nextReviewAt = now + 1 * 24 * 60 * 60 * 1000;
  }

  return { correct, wrong, consecutiveCorrect, nextReviewAt, mastered };
}
