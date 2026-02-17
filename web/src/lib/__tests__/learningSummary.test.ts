import { weakScore, isDue, getWeakTop, getDueTop, dailyMissionItems } from '../learningSummary';

describe('learningSummary', () => {
  describe('weakScore', () => {
    it('오답 많을수록 높은 점수', () => {
      expect(weakScore(5, 1)).toBeGreaterThan(weakScore(1, 5));
    });
    it('동일 오답/정답이면 1', () => {
      expect(weakScore(3, 3)).toBe(1);
    });
  });

  describe('isDue', () => {
    it('마스터 안 됐고 시간 지나면 true', () => {
      expect(isDue({ mastered: false, nextReviewAt: 100 }, 200)).toBe(true);
    });
    it('마스터 됐으면 false', () => {
      expect(isDue({ mastered: true, nextReviewAt: 100 }, 200)).toBe(false);
    });
    it('아직 시간 안 됐으면 false', () => {
      expect(isDue({ mastered: false, nextReviewAt: 300 }, 200)).toBe(false);
    });
  });

  describe('getWeakTop', () => {
    it('오답 비율 높은 순으로 정렬', () => {
      const progress = {
        a: { wrong: 5, correct: 1, mastered: false, nextReviewAt: 0 },
        b: { wrong: 1, correct: 5, mastered: false, nextReviewAt: 0 },
        c: { wrong: 3, correct: 1, mastered: false, nextReviewAt: 0 },
      };
      const result = getWeakTop(progress as any, 3);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('c');
      expect(result[2].id).toBe('b');
    });
  });

  describe('dailyMissionItems', () => {
    it('빈 진도에서는 전부 신규', () => {
      const items = [
        { id: '1', hanja: '一' },
        { id: '2', hanja: '二' },
        { id: '3', hanja: '三' },
      ] as any[];
      const result = dailyMissionItems(items, {}, Date.now(), 3);
      expect(result.composition.fresh).toBe(3);
      expect(result.composition.review).toBe(0);
      expect(result.composition.weak).toBe(0);
      expect(result.items).toHaveLength(3);
    });
  });
});
