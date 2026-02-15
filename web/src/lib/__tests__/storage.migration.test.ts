import { loadState } from '../storage';
import type { AppState } from '../types';

describe('storage migration (localStorage v1)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('normalizes legacy ids and merges duplicates, then persists once', () => {
    const legacy: AppState = {
      version: 1,
      settings: { dailyCount: 5, lastGradeLabel: '8급' },
      streak: { count: 0, lastStudyDate: null },
      stats: { quizAnswered: 0 },
      progress: {
        // legacy id format
        '5-028': { correct: 1, wrong: 2, consecutiveCorrect: 1, nextReviewAt: 999, mastered: false },
        // new id format, same logical item
        '5급-028': { correct: 3, wrong: 1, consecutiveCorrect: 2, nextReviewAt: 100, mastered: true },
      },
    };

    window.localStorage.setItem('hanja-study:v1', JSON.stringify(legacy));

    const st = loadState();

    // should be normalized to the new key and merged
    expect(Object.keys(st.progress)).toEqual(['5급-028']);
    expect(st.progress['5급-028']).toMatchObject({
      correct: 3,
      wrong: 2,
      consecutiveCorrect: 2,
      mastered: true,
      nextReviewAt: 100, // min due date is preserved
    });

    // migration should persist once so subsequent screens see normalized ids
    const raw2 = window.localStorage.getItem('hanja-study:v1');
    expect(raw2).toBeTruthy();
    const parsed2 = JSON.parse(raw2 as string) as AppState;
    expect(Object.keys(parsed2.progress)).toEqual(['5급-028']);
  });
});
