'use client';

import type { GradeLabel } from './types';

export type LastSession =
  | {
      version: 1;
      mode: 'study';
      gradeLabel: GradeLabel;
      n: 5 | 10 | 15;
      itemIds: string[];
      idx: number; // current card index
      startedAt: number;
      updatedAt: number;
    }
  | {
      version: 1;
      mode: 'quiz';
      gradeLabel: GradeLabel;
      n: 5 | 10 | 15;
      itemIds: string[];
      qIdx: number;
      startedAt: number;
      updatedAt: number;
    };

const KEY = 'hanja-study:lastSession:v1';

/** 세션 만료 시간: 4시간 (아이가 학원 갔다 돌아와도 이어할 수 있는 시간) */
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

export function loadLastSession(): LastSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as unknown;
    if (!s || typeof s !== 'object') return null;
    if (!('version' in s) || (s as { version?: number }).version !== 1) return null;
    const session = s as LastSession;
    // 만료 검사: updatedAt으로부터 TTL 초과 시 무효
    if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveLastSession(s: LastSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify({ ...s, updatedAt: Date.now() }));
}

export function clearLastSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
