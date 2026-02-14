'use client';

import type { AppState, KanjiProgress } from './types';
import { todayKey } from './kanji';

const STORAGE_KEY = 'hanja-study:v1';

export function defaultState(): AppState {
  return {
    version: 1,
    settings: { dailyCount: 5 },
    streak: { count: 0, lastStudyDate: null },
    stats: { quizAnswered: 0 },
    progress: {},
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1) return defaultState();
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
      streak: { ...defaultState().streak, ...(parsed.streak || {}) },
      stats: { ...defaultState().stats, ...(parsed.stats || {}) },
      progress: parsed.progress || {},
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getProgress(state: AppState, id: string): KanjiProgress | undefined {
  return state.progress[id];
}

export function setProgress(state: AppState, id: string, prog: KanjiProgress): AppState {
  return { ...state, progress: { ...state.progress, [id]: prog } };
}

export function bumpStreakOnStudy(state: AppState): AppState {
  const today = todayKey();
  const last = state.streak.lastStudyDate;
  if (last === today) return state;

  // naive streak: if studied yesterday => +1 else reset to 1
  const d = new Date();
  const y = new Date(d);
  y.setDate(d.getDate() - 1);
  const yesterday = todayKey(y);

  const nextCount = last === yesterday ? state.streak.count + 1 : 1;
  return { ...state, streak: { count: nextCount, lastStudyDate: today } };
}
