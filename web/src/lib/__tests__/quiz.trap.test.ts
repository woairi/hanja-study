import { makeTrapQ } from '../quiz';
import type { KanjiItem } from '../types';

describe('quiz trap question', () => {
  test('does not generate duplicate options even if confusables contain duplicates', () => {
    const k: KanjiItem = {
      id: '8급-001',
      grade: 8,
      gradeLabel: '8급',
      hanja: '日',
      reading: '일',
      meaning: '날',
      confusables: ['曰', '曰', '目', '日'],
    };

    const pool: KanjiItem[] = [
      k,
      { id: '8급-002', grade: 8, gradeLabel: '8급', hanja: '曰', reading: '왈', meaning: '가로되' },
      { id: '8급-003', grade: 8, gradeLabel: '8급', hanja: '目', reading: '목', meaning: '눈' },
      { id: '8급-004', grade: 8, gradeLabel: '8급', hanja: '白', reading: '백', meaning: '흰' },
      { id: '8급-005', grade: 8, gradeLabel: '8급', hanja: '口', reading: '구', meaning: '입' },
    ];

    const q = makeTrapQ(k, pool);

    const values = q.options.map((o) => o.value);
    expect(values).toHaveLength(4);
    expect(new Set(values).size).toBe(4);
    expect(values).toContain('日');
  });
});
