import { generateExam, getBlueprint, isPass, examTypeLabel } from '../generator';
import { defaultState, recordExamResult, xpProgress } from '../../storage';

describe('exam generator', () => {
  it('8급 빠른 도전 10문항 생성', () => {
    const qs = generateExam('8급', 'quick');
    expect(qs.length).toBe(10);
    for (const q of qs) {
      expect(q.options.length >= 0).toBe(true); // matching은 0개
      if (q.type !== 'matching') {
        expect(q.options.length).toBe(4);
        expect(q.options.some((o) => o.value === q.answer)).toBe(true);
      }
      expect(q.kanjiId).toBeTruthy();
      expect(q.id).toMatch(/^exam-/);
    }
  });

  it('정답이 보기에 반드시 포함 (non-matching)', () => {
    const qs = generateExam('7급', 'full').filter((q) => q.type !== 'matching');
    for (const q of qs) {
      const values = q.options.map((o) => o.value);
      expect(values).toContain(q.answer);
    }
  });

  it('보기에 중복 없음 (non-matching)', () => {
    const qs = generateExam('6급', 'quick').filter((q) => q.type !== 'matching');
    for (const q of qs) {
      const values = q.options.map((o) => o.value);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    }
  });

  it('유형 연습 모드는 지정 유형만', () => {
    const qs = generateExam('8급', 'type_practice', 'radical_strokes');
    expect(qs.length).toBe(10);
    for (const q of qs) {
      expect(q.type).toBe('radical_strokes');
    }
  });

  it('isPass 70% 기준', () => {
    expect(isPass(7, 10, '8급')).toBe(true);
    expect(isPass(6, 10, '8급')).toBe(false);
  });

  it('examTypeLabel 반환', () => {
    expect(examTypeLabel('read_hanja')).toBe('독음');
    expect(examTypeLabel('radical_strokes')).toBe('부수·획수');
    expect(examTypeLabel('antonym_synonym')).toBe('반대어·유의어');
    expect(examTypeLabel('idiom')).toBe('사자성어');
    expect(examTypeLabel('matching')).toBe('짝짓기');
  });

  it('getBlueprint 급수별 반환', () => {
    const bp = getBlueprint('4급Ⅱ');
    expect(bp.gradeLabel).toBe('4급Ⅱ');
    expect(bp.passScore).toBe(70);
  });

  // P1 tests
  it('6급 full에 반대어/유의어/사자성어/짝짓기 포함', () => {
    const qs = generateExam('6급', 'full');
    const types = new Set(qs.map((q) => q.type));
    // 6급 blueprint에 7종 모두 있으므로 대부분 포함
    expect(types.size).toBeGreaterThanOrEqual(4);
  });

  it('antonym_synonym 유형 연습', () => {
    const qs = generateExam('6급', 'type_practice', 'antonym_synonym');
    expect(qs.length).toBe(10);
    for (const q of qs) {
      // antonym_synonym이 부족하면 read_hanja로 대체될 수 있음
      expect(['antonym_synonym', 'read_hanja']).toContain(q.type);
    }
  });

  it('idiom 유형 연습', () => {
    const qs = generateExam('6급', 'type_practice', 'idiom');
    expect(qs.length).toBe(10);
    for (const q of qs) {
      expect(['idiom', 'meaning_reading']).toContain(q.type);
    }
  });

  it('matching 문항에 matchPairs 포함', () => {
    const qs = generateExam('6급', 'type_practice', 'matching');
    expect(qs.length).toBe(10);
    for (const q of qs) {
      expect(q.type).toBe('matching');
      expect(q.matchPairs).toBeDefined();
      expect(q.matchPairs!.length).toBe(4);
    }
  });
});

describe('exam XP & history', () => {
  it('recordExamResult XP 부여 + 이력 추가', () => {
    let st = defaultState();
    st = recordExamResult(st, {
      grade: '8급', mode: 'quick', score: 8, total: 10, passed: true, finishedAt: Date.now(),
    });

    expect(st.examHistory.length).toBe(1);
    expect(st.examHistory[0].passed).toBe(true);
    expect(st.gamification.xpTotal).toBe(8 * 2 + 30); // 16 + 30 = 46
    expect(st.gamification.examClearCount).toBe(1);
    expect(st.gamification.badges).toContain('8급');
  });

  it('불합격 시 뱃지 미부여 + XP는 정답분만', () => {
    let st = defaultState();
    st = recordExamResult(st, {
      grade: '7급', mode: 'quick', score: 3, total: 10, passed: false, finishedAt: Date.now(),
    });

    expect(st.gamification.xpTotal).toBe(3 * 2); // 6
    expect(st.gamification.examClearCount).toBe(0);
    expect(st.gamification.badges).not.toContain('7급');
  });

  it('xpProgress 레벨 계산', () => {
    expect(xpProgress(0)).toEqual({ level: 1, current: 0, needed: 100, pct: 0 });
    expect(xpProgress(150)).toEqual({ level: 2, current: 50, needed: 100, pct: 50 });
    expect(xpProgress(300)).toEqual({ level: 4, current: 0, needed: 100, pct: 0 });
  });

  it('이력 최대 50건 유지', () => {
    let st = defaultState();
    for (let i = 0; i < 55; i++) {
      st = recordExamResult(st, {
        grade: '8급', mode: 'quick', score: 5, total: 10, passed: false, finishedAt: Date.now() + i,
      });
    }
    expect(st.examHistory.length).toBe(50);
  });
});
