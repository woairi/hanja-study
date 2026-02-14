export type GradeLabel = '8급' | '7급' | '7급Ⅱ' | '6급' | '6급Ⅱ' | '5급';

export type KanjiItem = {
  id: string;
  grade: number; // 8, 7, 7.5, 6, 6.5, 5
  gradeLabel: GradeLabel;
  hanja: string;
  reading: string;
  meaning: string;
  radical?: string;
  totalStrokes?: number;
  confusables?: string[];
};

export type KanjiProgress = {
  correct: number;
  wrong: number;
  consecutiveCorrect: number;
  nextReviewAt: number; // epoch ms
  mastered?: boolean;
};

export type AppState = {
  version: 1;
  settings: {
    dailyCount: 5 | 10 | 15;
    lastGradeLabel?: GradeLabel;
  };
  streak: {
    count: number;
    lastStudyDate: string | null; // YYYY-MM-DD
  };
  stats: {
    quizAnswered: number;
  };
  progress: Record<string, KanjiProgress>; // key: KanjiItem.id
};
