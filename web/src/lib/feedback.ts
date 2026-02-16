'use client';

/**
 * 퀴즈/학습 효과음 + 햅틱 피드백
 * — Web Audio API로 짧은 효과음 생성 (외부 파일 불필요)
 * — Vibration API로 햅틱 (지원 기기만)
 * — localStorage로 음소거 설정 저장
 */

const MUTE_KEY = 'hanja-study:mute';

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(muted: boolean) {
  if (typeof window === 'undefined') return;
  if (muted) localStorage.setItem(MUTE_KEY, '1');
  else localStorage.removeItem(MUTE_KEY);
}

const AudioContext = typeof window !== 'undefined'
  ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
  : null;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!AudioContext) return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** 정답 효과음: 짧은 상승 톤 (200ms) */
export function playCorrect() {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, c.currentTime); // C5
  osc.frequency.linearRampToValueAtTime(784, c.currentTime + 0.12); // G5
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.2);
}

/** 오답 효과음: 짧은 하강 톤 (200ms) */
export function playWrong() {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(330, c.currentTime); // E4
  osc.frequency.linearRampToValueAtTime(220, c.currentTime + 0.15); // A3
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.2);
}

/** 뱃지/완료 축하음: 밝은 아르페지오 (400ms) */
export function playCelebrate() {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

/** 햅틱 피드백 (지원 기기만) */
export function vibrate(pattern: number | number[] = 30) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** 정답 피드백: 소리 + 짧은 진동 */
export function feedbackCorrect() {
  playCorrect();
  vibrate(20);
}

/** 오답 피드백: 소리 + 더블 진동 */
export function feedbackWrong() {
  playWrong();
  vibrate([30, 50, 30]);
}

/** 축하 피드백: 소리 + 긴 진동 */
export function feedbackCelebrate() {
  playCelebrate();
  vibrate([50, 30, 50]);
}
