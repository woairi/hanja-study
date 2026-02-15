import { applyAnswer, initialProgress } from '../srs';

describe('SRS applyAnswer', () => {
  const day = 24 * 60 * 60 * 1000;

  test('intervals for normal grades and mastery at 4 consecutive correct', () => {
    const now = 1_000_000;
    let p = initialProgress(now);

    // 1st correct => d2 (3 days)
    p = applyAnswer(p, true, now, { gradeLabel: '8급' });
    expect(p.consecutiveCorrect).toBe(1);
    expect(p.nextReviewAt).toBe(now + 3 * day);
    expect(p.mastered).toBe(false);

    // 2nd correct => d3 (7 days)
    p = applyAnswer(p, true, now, { gradeLabel: '8급' });
    expect(p.consecutiveCorrect).toBe(2);
    expect(p.nextReviewAt).toBe(now + 7 * day);

    // 3rd correct => still d3
    p = applyAnswer(p, true, now, { gradeLabel: '8급' });
    expect(p.consecutiveCorrect).toBe(3);
    expect(p.nextReviewAt).toBe(now + 7 * day);

    // 4th correct => mastered + dMaster (30 days)
    p = applyAnswer(p, true, now, { gradeLabel: '8급' });
    expect(p.consecutiveCorrect).toBe(4);
    expect(p.mastered).toBe(true);
    expect(p.nextReviewAt).toBe(now + 30 * day);
  });

  test('wrong answer resets consecutiveCorrect/mastered and sets nextReviewAt to +1 day', () => {
    const now = 2_000_000;
    const prev = { correct: 10, wrong: 0, consecutiveCorrect: 4, nextReviewAt: now + 30 * day, mastered: true };

    const next = applyAnswer(prev, false, now, { gradeLabel: '8급' });
    expect(next.wrong).toBe(1);
    expect(next.consecutiveCorrect).toBe(0);
    expect(next.mastered).toBe(false);
    expect(next.nextReviewAt).toBe(now + 1 * day);
  });

  test('hard grades (4급/4급Ⅱ) use shorter d2/d3/dMaster', () => {
    const now = 3_000_000;
    let p = initialProgress(now);

    p = applyAnswer(p, true, now, { gradeLabel: '4급' });
    expect(p.nextReviewAt).toBe(now + 2 * day);

    p = applyAnswer(p, true, now, { gradeLabel: '4급' });
    expect(p.nextReviewAt).toBe(now + 5 * day);

    p = applyAnswer(p, true, now, { gradeLabel: '4급' });
    p = applyAnswer(p, true, now, { gradeLabel: '4급' });
    expect(p.mastered).toBe(true);
    expect(p.nextReviewAt).toBe(now + 21 * day);
  });
});
