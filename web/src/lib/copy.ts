'use client';

export function pickOne<T>(items: T[], seed: string): T {
  // simple deterministic hash
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % items.length;
  return items[idx];
}

/** 성취 기반 홈 인사 메시지 (반복 피로 감소) */
export function homeGreeting(streak: number, mastered: number, seed: string): string {
  if (streak >= 7) {
    return pickOne([
      '7일 연속 성공! 공룡처럼 강해지고 있어 🦖',
      '일주일 연속이라니! 대단해 🌈',
      '연속 기록이 무서운 속도야! 🚀',
    ], seed);
  }
  if (streak >= 3) {
    return pickOne([
      `${streak}일 연속! 꾸준함이 실력이야 ⭐`,
      '연속 기록이 쌓이고 있어! 💪',
      '매일 하는 게 가장 어렵고 가장 대단한 거야 🏃',
    ], seed);
  }
  if (mastered >= 100) {
    return pickOne([
      `벌써 ${mastered}자 마스터! 한자 박사에 가까워지고 있어 🧠`,
      '100자 넘게 마스터했어! 진짜 대단해 🎉',
    ], seed);
  }
  if (mastered >= 30) {
    return pickOne([
      `${mastered}자 마스터 중! 쭉쭉 올라가고 있어 📈`,
      '한자 실력이 눈에 보이게 늘고 있어 👀',
    ], seed);
  }
  return pickOne([
    '오늘도 한 걸음! 작은 습관이 큰 실력이 돼 🌱',
    '매일 조금씩! 그게 비밀이야 🔑',
    '한자 공부, 오늘도 시작해볼까? 🐉',
  ], seed);
}

/** 학습 완료 메시지 */
export function studyDoneMessage(count: number, seed: string): string {
  if (count >= 15) {
    return pickOne([
      `${count}자나 공부했어! 오늘 정말 열심히 했다 🔥`,
      '대량 학습 완료! 실력이 팍팍 올라갈 거야 💯',
    ], seed);
  }
  if (count >= 10) {
    return pickOne([
      '10자 이상 완료! 꽤 많이 했어 👍',
      '오늘 학습량 최고! 잘했어 ⭐',
    ], seed);
  }
  return pickOne([
    '학습 완료! 퀴즈로 확인해볼까? 📝',
    '잘했어! 이제 퀴즈로 기억을 단단하게 🧱',
    '공부 끝! 퀴즈 풀면 기억이 2배 💡',
  ], seed);
}
