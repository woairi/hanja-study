'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ALL_KANJI } from '@/lib/kanji';
import type { GradeLabel, KanjiItem } from '@/lib/types';
import { bumpStreakOnStudy, loadState, saveState } from '@/lib/storage';
import { pickStudyItems } from '@/lib/selection';

type StudySession = {
  gradeLabel: GradeLabel;
  n: number;
  itemIds: string[];
  startedAt: number;
};

const SESSION_KEY = 'hanja-study:session';

export default function StudyClient() {
  const sp = useSearchParams();

  const grade = (sp.get('grade') || '8급') as GradeLabel;
  const n = Math.max(1, Math.min(15, Number(sp.get('n') || '5'))) as 5 | 10 | 15;

  const [items, setItems] = useState<KanjiItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const now = Date.now();
    let st = loadState();

    // create new session
    const pick = pickStudyItems(grade, n, st, now);
    st = pick.state;
    st = bumpStreakOnStudy(st);
    saveState(st);

    setItems(pick.items);
    setIdx(0);
    setRevealed(false);

    const session: StudySession = {
      gradeLabel: grade,
      n,
      itemIds: pick.items.map((x) => x.id),
      startedAt: now,
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [grade, n]);

  const current = items[idx];
  const isDone = idx >= items.length;

  const quizHref = useMemo(() => {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return '/';
    const session = JSON.parse(raw) as StudySession;
    return `/quiz?grade=${encodeURIComponent(session.gradeLabel)}&n=${session.n}`;
  }, []);

  if (!items.length) {
    return (
      <main className="mx-auto max-w-md p-4">
        <div className="text-sm text-gray-600">로딩중…</div>
      </main>
    );
  }

  if (isDone) {
    return (
      <main className="mx-auto max-w-md p-4">
        <h1 className="text-xl font-bold">학습 완료</h1>
        <p className="mt-2 text-sm text-gray-600">이제 퀴즈로 가자.</p>
        <div className="mt-4">
          <Link className="inline-block rounded bg-blue-600 px-4 py-2 text-white" href={quizHref}>
            퀴즈 시작
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-600 underline" href="/">
          ← 급수 선택
        </Link>
        <div className="text-sm text-gray-600">
          {grade} · {idx + 1}/{items.length}
        </div>
      </div>

      <div className="rounded-xl border p-6 text-center">
        <div className="text-6xl font-black tracking-wide">{current.hanja}</div>
        <div className="mt-4">
          {revealed ? (
            <>
              <div className="text-xl font-semibold">{current.meaning} {current.reading}</div>
              <div className="mt-2 text-sm text-gray-600">
                부수: {current.radical ?? '-'} · 획수: {current.totalStrokes ?? '-'}
              </div>
            </>
          ) : (
            <button
              className="rounded bg-gray-900 px-4 py-2 text-white"
              onClick={() => setRevealed(true)}
            >
              뜻/음 보기
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 rounded border px-4 py-2"
          onClick={() => {
            setRevealed(false);
            setIdx((i) => Math.max(0, i - 1));
          }}
          disabled={idx === 0}
        >
          이전
        </button>
        <button
          className="flex-1 rounded bg-blue-600 px-4 py-2 text-white"
          onClick={() => {
            setRevealed(false);
            setIdx((i) => i + 1);
          }}
        >
          다음
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        팁: 한자를 보고, 뜻/음을 떠올린 다음에 “보기”를 눌러.
      </div>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function idToItem(id: string): KanjiItem | undefined {
  return ALL_KANJI.find((k) => k.id === id);
}
