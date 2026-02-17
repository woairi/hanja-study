import { generateExam, getBlueprint, isPass, examTypeLabel } from '../generator';

describe('exam generator', () => {
  it('8급 빠른 도전 10문항 생성', () => {
    const qs = generateExam('8급', 'quick');
    expect(qs.length).toBe(10);
    for (const q of qs) {
      expect(q.options.length).toBe(4);
      expect(q.options.some((o) => o.value === q.answer)).toBe(true);
      expect(q.kanjiId).toBeTruthy();
      expect(q.id).toMatch(/^exam-/);
    }
  });

  it('정답이 보기에 반드시 포함', () => {
    const qs = generateExam('7급', 'full');
    for (const q of qs) {
      const values = q.options.map((o) => o.value);
      expect(values).toContain(q.answer);
    }
  });

  it('보기에 중복 없음', () => {
    const qs = generateExam('6급', 'quick');
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
  });

  it('getBlueprint 급수별 반환', () => {
    const bp = getBlueprint('4급Ⅱ');
    expect(bp.gradeLabel).toBe('4급Ⅱ');
    expect(bp.passScore).toBe(70);
  });
});
