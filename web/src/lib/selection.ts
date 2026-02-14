import type { AppState, GradeLabel, KanjiItem } from './types';
import { kanjiByGradeLabel } from './kanji';
import { initialProgress } from './srs';

export type StudyPick = { items: KanjiItem[]; state: AppState };

export function pickStudyItems(gradeLabel: GradeLabel, n: number, state: AppState, now: number): StudyPick {
  const all = kanjiByGradeLabel(gradeLabel);

  const due: KanjiItem[] = [];
  const fresh: KanjiItem[] = [];

  for (const k of all) {
    const p = state.progress[k.id];
    if (!p) {
      fresh.push(k);
    } else if (!p.mastered && p.nextReviewAt <= now) {
      due.push(k);
    }
  }

  // Prefer due first, then fresh, then non-mastered not-yet-due (to fill)
  const notMastered = all.filter((k) => !state.progress[k.id]?.mastered);

  const picked: KanjiItem[] = [];
  function takeFrom(arr: KanjiItem[]) {
    // shuffle-ish: take random
    while (arr.length && picked.length < n) {
      const i = Math.floor(Math.random() * arr.length);
      picked.push(arr.splice(i, 1)[0]);
    }
  }

  takeFrom(due);
  takeFrom(fresh);

  if (picked.length < n) {
    const pool = notMastered.filter((k) => !picked.some((p) => p.id === k.id));
    takeFrom(pool);
  }

  // Ensure all picked have progress initialized
  let nextState = state;
  for (const k of picked) {
    if (!nextState.progress[k.id]) {
      nextState = {
        ...nextState,
        progress: {
          ...nextState.progress,
          [k.id]: initialProgress(now),
        },
      };
    }
  }

  return { items: picked, state: nextState };
}
