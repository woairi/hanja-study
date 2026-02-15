'use client';

import type { AppState, KanjiProgress } from './types';
import { todayKey } from './kanji';

const STORAGE_KEY = 'hanja-study:v1';

export function defaultState(): AppState {
  return {
    version: 1,
    settings: { dailyCount: 5, lastGradeLabel: '8급' },
    streak: { count: 0, lastStudyDate: null },
    stats: { quizAnswered: 0 },
    progress: {},
  };
}

function normalizeProgressKey(id: string): string {
  // Legacy ids sometimes looked like "5-028" or "8-002".
  const m1 = id.match(/^([4-8])-(\d{3})$/);
  if (m1) return `${m1[1]}급-${m1[2]}`;

  // Support a few legacy ways of writing "Ⅱ".
  const m2 = id.match(/^([4-8])(?:II|Ⅱ)-(\d{3})$/);
  if (m2) return `${m2[1]}급Ⅱ-${m2[2]}`;

  const m3 = id.match(/^([4-8])급(?:II|Ⅱ)-(\d{3})$/);
  if (m3) return `${m3[1]}급Ⅱ-${m3[2]}`;

  return id;
}

function mergeProgress(a: KanjiProgress, b: KanjiProgress): KanjiProgress {
  // Keep the more "experienced" values; don't lose due.
  const nextReviewAt = Math.min(
    typeof a.nextReviewAt === 'number' ? a.nextReviewAt : Infinity,
    typeof b.nextReviewAt === 'number' ? b.nextReviewAt : Infinity
  );

  return {
    correct: Math.max(a.correct || 0, b.correct || 0),
    wrong: Math.max(a.wrong || 0, b.wrong || 0),
    consecutiveCorrect: Math.max(a.consecutiveCorrect || 0, b.consecutiveCorrect || 0),
    mastered: !!a.mastered || !!b.mastered,
    nextReviewAt: Number.isFinite(nextReviewAt) ? nextReviewAt : Date.now(),
  };
}

function migrateStateOnce(st: AppState): { state: AppState; changed: boolean } {
  const progress = st.progress || {};
  const keys = Object.keys(progress);
  let changed = false;

  const next: Record<string, KanjiProgress> = {};

  for (const id of keys) {
    const nid = normalizeProgressKey(id);
    const p = progress[id];
    if (!p) continue;

    if (nid !== id) changed = true;

    if (!next[nid]) next[nid] = p;
    else {
      next[nid] = mergeProgress(next[nid], p);
      changed = true;
    }
  }

  return changed ? { state: { ...st, progress: next }, changed } : { state: st, changed };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1) return defaultState();

    const merged: AppState = {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
      streak: { ...defaultState().streak, ...(parsed.streak || {}) },
      stats: { ...defaultState().stats, ...(parsed.stats || {}) },
      progress: parsed.progress || {},
    };

    const mig = migrateStateOnce(merged);
    if (mig.changed) {
      // persist once so all screens see the same ids
      saveState(mig.state);
    }
    return mig.state;
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
