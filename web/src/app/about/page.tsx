'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type TelemetryState = {
  v: 1;
  counts: Record<string, number>;
  lastAt: Record<string, number>;
};

const KEY = 'hanja-study:telemetry:v1';

function loadTelemetry(): TelemetryState {
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

function clearTelemetry() {
  if (typeof window === 'undefined') return;
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (k === KEY || k.startsWith(`${KEY}:`)) window.localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

function fmtTime(ms?: number) {
  if (!ms) return '-';
  const d = new Date(ms);
  return d.toLocaleString();
}

export default function AboutPage() {
  const [telemetryOn, setTelemetryOn] = useState(false);
  const [tel, setTel] = useState<TelemetryState>({ v: 1, counts: {}, lastAt: {} });

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const on = sp.get('debug') === '1';
      setTelemetryOn(on);
      if (on) setTel(loadTelemetry());
    } catch {
      // ignore
    }
  }, []);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-extrabold">안내</h1>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
        <li>어문회 급수(8급~4급, 7급Ⅱ/6급Ⅱ/4급Ⅱ 포함) 기준으로 학습합니다.</li>
        <li>학습 기록은 로그인 없이 이 기기(브라우저)에 저장됩니다.</li>
        <li>퀴즈의 20%는 비슷한 한자를 구분하는 함정문제입니다.</li>
      </ul>
      <p className="mt-4 text-sm text-gray-600">(MVP) 쓰기/획순은 추후 추가할 수 있어요.</p>

      {telemetryOn && (
        <section className="card mt-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">(디버그) 사용 로그</h2>
            <button
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={() => {
                clearTelemetry();
                setTel(loadTelemetry());
              }}
            >
              초기화
            </button>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            {Object.keys(tel.counts).length === 0 && <div style={{ color: 'var(--muted)' }}>아직 기록이 없어.</div>}

            {Object.entries(tel.counts)
              .filter(([k]) => !k.startsWith('meta:'))
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/70 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold">{k}</div>
                    <div className="font-extrabold">{v}</div>
                  </div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                    마지막: {fmtTime(tel.lastAt[k])}
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            팁: <span className="font-extrabold">/about?debug=1</span>
          </div>
        </section>
      )}

      <div className="mt-6">
        <Link className="text-blue-700 underline" href="/">
          ← 홈
        </Link>
      </div>
    </main>
  );
}
