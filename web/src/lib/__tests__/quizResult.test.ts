import {
  loadQuizResult,
  QUIZ_RESULT_CACHE_KEY,
  QUIZ_RESULT_KEY,
  QUIZ_RESULT_TTL_MS,
  saveQuizResult,
  type QuizResultPayload,
} from '../quizResult';

describe('quiz result cache/ttl', () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function samplePayload(finishedAt = now): QuizResultPayload {
    return {
      version: 1,
      quizId: 'session',
      grade: '8급',
      total: 10,
      score: 8,
      wrongKanjiIds: ['8급-001'],
      xp: 80,
      finishedAt,
    };
  }

  test('loads from session/local right after save', () => {
    const payload = samplePayload();
    saveQuizResult(payload);

    const loaded = loadQuizResult();
    expect(loaded).toEqual(payload);
    expect(window.localStorage.getItem(QUIZ_RESULT_CACHE_KEY)).toBeTruthy();
  });

  test('falls back to local cache when session key is missing', () => {
    const payload = samplePayload();
    saveQuizResult(payload);
    window.sessionStorage.removeItem(QUIZ_RESULT_KEY);

    const loaded = loadQuizResult();
    expect(loaded).toEqual(payload);
    expect(window.sessionStorage.getItem(QUIZ_RESULT_KEY)).toBeTruthy();
  });

  test('expires and clears stale cache by TTL', () => {
    const payload = samplePayload(now - QUIZ_RESULT_TTL_MS - 1);
    saveQuizResult(payload);

    const loaded = loadQuizResult();
    expect(loaded).toBeNull();
    expect(window.sessionStorage.getItem(QUIZ_RESULT_KEY)).toBeNull();
    expect(window.localStorage.getItem(QUIZ_RESULT_CACHE_KEY)).toBeNull();
  });
});
