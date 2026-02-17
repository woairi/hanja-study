export type GradeLabel = '8급' | '7급' | '7급Ⅱ' | '6급' | '6급Ⅱ' | '5급' | '4급' | '4급Ⅱ';

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
  exampleWord?: string;
  exampleMeaning?: string;
  radicalMeaning?: string;
};

export type KanjiProgress = {
  correct: number;
  wrong: number;
  consecutiveCorrect: number;
  nextReviewAt: number; // epoch ms
  mastered?: boolean;
};

export type ExamRecord = {
  grade: string;
  mode: string;
  score: number;
  total: number;
  passed: boolean;
  finishedAt: number;
  byType?: Record<string, { correct: number; total: number }>;
};

export type AppState = {
  version: 1 | 2 | 3;
  settings: {
    dailyCount: 5 | 10 | 15;
    lastGradeLabel?: GradeLabel;
    nickname?: string;
    onboardingCompleted?: boolean;
    onboardingCompletedAt?: number;
    onboardingSkipped?: boolean;
  };
  streak: {
    count: number;
    lastStudyDate: string | null; // YYYY-MM-DD
  };
  stats: {
    quizAnswered: number;
    daily: Record<
      string,
      {
        answered: number;
        correct: number;
        wrong: number;
      }
    >; // key: YYYY-MM-DD
  };
  progress: Record<string, KanjiProgress>; // key: KanjiItem.id
  gamification: {
    xpTotal: number;
    level: number;
    examClearCount: number;
    badges: string[]; // 합격한 급수: e.g. '8급', '7급'
  };
  examHistory: ExamRecord[];
};
