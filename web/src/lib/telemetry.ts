'use client';

export type TelemetryEvent =
  | 'home_primary_click'
  | 'home_secondary_click'
  | 'study_done'
  | 'review_done'
  | 'quiz_done'
  | 'quiz_retry_click'
  | 'post_done_weak_review_click'
  | 'post_done_more_review_click';

type TelemetryState = {
  v: 1;
  counts: Record<string, number>;
  lastAt: Record<string, number>;
};

const KEY = 'hanja-study:telemetry:v1';

function load(): TelemetryState {
  if (typeof window === 'undefined') return { v: 1, counts: {}, lastAt: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { v: 1, counts: {}, lastAt: {} };
    const parsed = JSON.parse(raw) as TelemetryState;
    if (!parsed || parsed.v !== 1) return { v: 1, counts: {}, lastAt: {} };
    return { v: 1, counts: parsed.counts || {}, lastAt: parsed.lastAt || {} };
  } catch {
    return { v: 1, counts: {}, lastAt: {} };
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

export function logEvent(name: TelemetryEvent, meta?: Record<string, string | number | boolean | null | undefined>) {
  const st = load();
  st.counts[name] = (st.counts[name] || 0) + 1;
  st.lastAt[name] = Date.now();

  // store a tiny last meta snapshot for debugging (best-effort)
  if (meta) {
    const key = `meta:${name}`;
    st.lastAt[key] = Date.now();
    st.counts[key] = 1;
    try {
      window.localStorage.setItem(`${KEY}:${key}`, JSON.stringify({ at: Date.now(), meta }));
    } catch {
      // ignore
    }
  }

  save(st);
}
