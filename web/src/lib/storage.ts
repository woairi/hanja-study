'use client';

import type { AppState, KanjiProgress } from './types';
import { todayKey } from './kanji';

/**
 * Local state storage (localStorage).
 *
 * ## Versioning & migrations
 * - We keep a *stable* primary key (`STORAGE_KEY`) and store `state.version` in the payload.
 * - Older releases wrote to versioned keys (ex: `hanja-study:v1`). We still read them as legacy.
 * - On load, we:
 *   1) load newest key if present
 *   2) else fall back to legacy keys
 *   3) run step-by-step migrations until CURRENT_VERSION
 *   4) persist to the newest key *only if* migration succeeded
 *
 * Failure policy (safety):
 * - If parsing/migration fails, we do **not** overwrite storage.
 * - We fall back to defaults so the app can still boot.
 */

const CURRENT_VERSION = 2 as const;

// New stable key (do not include version in key name).
const STORAGE_KEY = 'hanja-study:state';

// Legacy keys that may exist from older releases.
const LEGACY_KEYS = ['hanja-study:v1'];

function removePrefixedKeys(storage: Storage, prefix: string) {
  // Copy keys first because storage is live.
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k) keys.push(k);
  }
  for (const k of keys) {
    if (k.startsWith(prefix)) storage.removeItem(k);
  }
}

export function clearAllLocalState(): void {
  if (typeof window === 'undefined') return;

  try {
    removePrefixedKeys(window.localStorage, 'hanja-study:');
  } catch {
    // ignore
  }

  try {
    removePrefixedKeys(window.sessionStorage, 'hanja-study:');
  } catch {
    // ignore
  }

  // Recreate the main state key with defaults so the app boots deterministically.
  try {
    saveState(defaultState());
  } catch {
    // ignore
  }
}

export function defaultState(): AppState {
  return {
    version: CURRENT_VERSION,
    settings: { dailyCount: 5, lastGradeLabel: '8급', nickname: '', onboardingCompleted: false },
    streak: { count: 0, lastStudyDate: null },
    stats: { quizAnswered: 0, daily: {} },
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

function migrateProgressIds(progress: Record<string, KanjiProgress> | undefined | null): {
  progress: Record<string, KanjiProgress>;
  changed: boolean;
} {
  const src = progress || {};
  const keys = Object.keys(src);
  let changed = false;

  const next: Record<string, KanjiProgress> = {};
  for (const id of keys) {
    const nid = normalizeProgressKey(id);
    const p = src[id];
    if (!p) continue;

    if (nid !== id) changed = true;

    if (!next[nid]) next[nid] = p;
    else {
      next[nid] = mergeProgress(next[nid], p);
      changed = true;
    }
  }

  return { progress: next, changed };
}

/**
 * v1 -> v2
 *
 * - Normalize legacy progress keys (ex: "5-028" -> "5급-028") and merge collisions.
 * - Keep shape identical otherwise.
 */
function migrateV1ToV2(st: AppState): { state: AppState; changed: boolean } {
  const { progress, changed } = migrateProgressIds(st.progress);
  if (!changed) return { state: { ...st, version: 2 }, changed: st.version !== 2 };
  return { state: { ...st, version: 2, progress }, changed: true };
}

function migrateToCurrent(st: AppState): { state: AppState; changed: boolean } {
  // Defensive: if a future version is encountered, do not attempt to down-migrate.
  if (!st || typeof st !== 'object') return { state: defaultState(), changed: false };
  if (typeof (st as { version?: unknown }).version !== 'number') return { state: defaultState(), changed: false };
  if (st.version > CURRENT_VERSION) return { state: st, changed: false };

  let cur: AppState = st;
  let changed = false;

  while (cur.version < CURRENT_VERSION) {
    if (cur.version === 1) {
      const mig = migrateV1ToV2(cur);
      cur = mig.state;
      changed = changed || mig.changed;
      continue;
    }

    // Should never happen, but ensures we don't loop forever.
    break;
  }

  return { state: cur, changed };
}

function mergeWithDefaults(parsed: AppState): AppState {
  const d = defaultState();
  return {
    ...d,
    ...parsed,
    // nested merges to be tolerant of partial/corrupted payloads
    settings: { ...d.settings, ...(parsed.settings || {}) },
    streak: { ...d.streak, ...(parsed.streak || {}) },
    stats: { ...d.stats, ...(parsed.stats || {}), daily: { ...d.stats.daily, ...(parsed.stats?.daily || {}) } },
    progress: parsed.progress || {},
  };
}

function loadRawFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;

  // New key first.
  const direct = window.localStorage.getItem(STORAGE_KEY);
  if (direct) return direct;

  // Legacy keys (best-effort).
  for (const k of LEGACY_KEYS) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }

  return null;
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();

  const raw = loadRawFromLocalStorage();
  if (!raw) return defaultState();

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || typeof parsed !== 'object') return defaultState();

    // Merge defaults *before* migration so migrators can assume required subtrees exist.
    const merged = mergeWithDefaults(parsed);
    const mig = migrateToCurrent(merged);

    if (mig.changed) {
      // Persist once so all screens see the migrated state.
      // Safety: only write after migration succeeded.
      saveState(mig.state);
    }

    return mig.state;
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore (quota/private mode)
  }
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

export function bumpDailyQuizStats(state: AppState, opts: { at: number; correct: boolean }): AppState {
  const key = todayKey(new Date(opts.at));
  const prev = state.stats.daily?.[key] || { answered: 0, correct: 0, wrong: 0 };
  const nextForDay = {
    answered: prev.answered + 1,
    correct: prev.correct + (opts.correct ? 1 : 0),
    wrong: prev.wrong + (opts.correct ? 0 : 1),
  };

  // keep daily stats bounded (last ~180 days)
  const entries = Object.entries({ ...(state.stats.daily || {}), [key]: nextForDay }).sort((a, b) => a[0].localeCompare(b[0]));
  const trimmed = entries.length > 180 ? entries.slice(entries.length - 180) : entries;
  const daily = Object.fromEntries(trimmed);

  return { ...state, stats: { ...state.stats, daily } };
}
