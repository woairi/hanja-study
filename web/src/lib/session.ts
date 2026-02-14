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

export function loadLastSession(): LastSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as unknown;
    if (!s || typeof s !== 'object') return null;
    if (!('version' in s) || (s as { version?: number }).version !== 1) return null;
    return s as LastSession;
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
