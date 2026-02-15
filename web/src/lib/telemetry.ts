'use client';

export type TelemetryEvent =
  | 'home_primary_click'
  | 'home_secondary_click'
  | 'home_onboarding_click'
  | 'study_done'
  | 'review_done'
  | 'quiz_done'
  | 'quiz_retry_click'
  | 'quiz_hint_use'
  | 'post_done_weak_review_click'
  | 'post_done_more_review_click'
  | 'quiz_wrong_tap'
  | 'quiz_next_mission_click'
  | 'quiz_result_missing_start_quiz_click'
  | 'quiz_result_missing_home_click';

type TelemetryState = {
  v: 1;
  counts: Record<string, number>;
  lastAt: Record<string, number>;
  /** last prune timestamp (best-effort; optional for backward compatibility) */
  lastPrunedAt?: number;
};

const KEY = 'hanja-study:telemetry:v1';

// Retention policy (keep tiny & predictable)
const META_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_META_KEYS = 30; // max number of meta:* entries tracked in st.counts/lastAt
const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000; // at most once per 6h

const EVENTS: TelemetryEvent[] = [
  'home_primary_click',
  'home_secondary_click',
  'home_onboarding_click',
  'study_done',
  'review_done',
  'quiz_done',
  'quiz_retry_click',
  'quiz_hint_use',
  'post_done_weak_review_click',
  'post_done_more_review_click',
  'quiz_wrong_tap',
  'quiz_next_mission_click',
  'quiz_result_missing_start_quiz_click',
  'quiz_result_missing_home_click',
];

function empty(): TelemetryState {
  return { v: 1, counts: {}, lastAt: {} };
}

function load(): TelemetryState {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as TelemetryState;
    if (!parsed || parsed.v !== 1) return empty();
    return { v: 1, counts: parsed.counts || {}, lastAt: parsed.lastAt || {}, lastPrunedAt: parsed.lastPrunedAt };
  } catch {
    return empty();
  }
}

function save(st: TelemetryState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(st));
  } catch {
    // ignore
  }
}

function metaStorageKey(metaKey: string) {
  return `${KEY}:${metaKey}`;
}

function isMetaKey(k: string): boolean {
  return k.startsWith('meta:');
}

function prune(st: TelemetryState, now: number): { state: TelemetryState; changed: boolean } {
  // Avoid doing potentially many localStorage calls too frequently.
  if (st.lastPrunedAt && now - st.lastPrunedAt < PRUNE_INTERVAL_MS) return { state: st, changed: false };

  let changed = false;

  // 1) Drop unknown keys (keep only known events + meta:*).
  const allowed = new Set<string>([...EVENTS, ...Object.keys(st.counts).filter(isMetaKey)]);
  for (const k of Object.keys(st.counts)) {
    if (!allowed.has(k) && !isMetaKey(k)) {
      delete st.counts[k];
      changed = true;
    }
  }
  for (const k of Object.keys(st.lastAt)) {
    if (!allowed.has(k) && !isMetaKey(k)) {
      delete st.lastAt[k];
      changed = true;
    }
  }

  // 2) TTL: remove meta:* entries that are too old.
  const metaKeys = Object.keys(st.lastAt).filter(isMetaKey);
  for (const k of metaKeys) {
    const at = st.lastAt[k] || 0;
    if (now - at > META_TTL_MS) {
      delete st.lastAt[k];
      delete st.counts[k];
      changed = true;
      try {
        window.localStorage.removeItem(metaStorageKey(k));
      } catch {
        // ignore
      }
    }
  }

  // 3) Cap: keep only the most recent meta keys.
  const remainingMeta = Object.keys(st.lastAt)
    .filter(isMetaKey)
    .map((k) => ({ k, at: st.lastAt[k] || 0 }))
    .sort((a, b) => b.at - a.at);

  if (remainingMeta.length > MAX_META_KEYS) {
    for (const { k } of remainingMeta.slice(MAX_META_KEYS)) {
      delete st.lastAt[k];
      delete st.counts[k];
      changed = true;
      try {
        window.localStorage.removeItem(metaStorageKey(k));
      } catch {
        // ignore
      }
    }
  }

  if (changed) st.lastPrunedAt = now;
  return { state: st, changed };
}

export function logEvent(name: TelemetryEvent, meta?: Record<string, string | number | boolean | null | undefined>) {
  const now = Date.now();
  const st = load();

  st.counts[name] = (st.counts[name] || 0) + 1;
  st.lastAt[name] = now;

  // store a tiny last meta snapshot for debugging (best-effort)
  if (meta) {
    const key = `meta:${name}`;
    st.lastAt[key] = now;
    st.counts[key] = 1;
    try {
      window.localStorage.setItem(metaStorageKey(key), JSON.stringify({ at: now, meta }));
    } catch {
      // ignore
    }
  }

  const pruned = prune(st, now);
  save(pruned.state);
}
