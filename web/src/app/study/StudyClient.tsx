'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ALL_KANJI } from '@/lib/kanji';
import type { GradeLabel, KanjiItem } from '@/lib/types';
import { bumpStreakOnStudy, loadState, saveState } from '@/lib/storage';
import { pickStudyItems } from '@/lib/selection';
import { loadLastSession, saveLastSession } from '@/lib/session';

type StudySession = {
  gradeLabel: GradeLabel;
  n: 5 | 10 | 15;
  itemIds: string[];
  startedAt: number;
};

const SESSION_KEY = 'hanja-study:session';
const FOCUS_KEY = 'hanja-study:focus';

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

    // resume if possible
    const last = loadLastSession();
    const wantResume = sp.get('resume') === '1';
    const reviewOnly = sp.get('review') === '1';
    const focus = sp.get('focus');

    let pickedItems: KanjiItem[] = [];
    let startIdx = 0;

    if (focus === 'weak') {
      const raw = window.sessionStorage.getItem(FOCUS_KEY);
      const focusIds = raw ? (JSON.parse(raw) as string[]) : [];
      const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));
      pickedItems = focusIds.map((id) => map.get(id)).filter((x): x is KanjiItem => !!x).slice(0, n);
      startIdx = 0;
    } else if (!reviewOnly && wantResume && last && last.mode === 'study' && last.gradeLabel === grade && last.n === n) {
      const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));
      pickedItems = last.itemIds.map((id) => map.get(id)).filter((x): x is KanjiItem => !!x);
      startIdx = Math.min(last.idx, Math.max(0, pickedItems.length - 1));
    } else {
      const pick = pickStudyItems(grade, n, st, now, { reviewOnly });
      st = pick.state;
      pickedItems = pick.items;
      startIdx = 0;
      // only bump streak on normal learning mode
      if (!reviewOnly) {
        st = bumpStreakOnStudy(st);
        saveState(st);
      }
    }

    setItems(pickedItems);
    setIdx(startIdx);
    setRevealed(false);

    const session: StudySession = {
      gradeLabel: grade,
      n,
      itemIds: pickedItems.map((x) => x.id),
      startedAt: now,
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    saveLastSession({
      version: 1,
      mode: 'study',
      gradeLabel: grade,
      n,
      itemIds: pickedItems.map((x) => x.id),
      idx: startIdx,
      startedAt: now,
      updatedAt: now,
    });
  }, [grade, n, sp]);

  const current = items[idx];
  const isDone = idx >= items.length;
  const reviewOnly = sp.get('review') === '1';
  const focusWeak = sp.get('focus') === 'weak';

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
    // focus/review mode: no quiz
    if (reviewOnly || focusWeak) {
      return (
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
          <div className="card w-full p-6">
            <div className="text-4xl">✅</div>
            <h1 className="mt-2 text-2xl font-extrabold">{focusWeak ? '약점 복습 완료!' : '복습 완료!'}</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              {focusWeak ? '약점만 빠르게 복습했어.' : '오늘 복습할 게 다 끝났어.'}
            </p>
            <div className="mt-5">
              <Link className="btn btn-primary focus-ring inline-flex w-full items-center justify-center" href="/progress">
                진도 보기
              </Link>
            </div>
            <div className="mt-3">
              <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/">
                홈으로
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
        <div className="card w-full p-6">
          <div className="text-4xl">🎉</div>
          <h1 className="mt-2 text-2xl font-extrabold">학습 완료!</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            이제 퀴즈로 가자.
          </p>
          <div className="mt-5">
            <Link
              className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
              href={quizHref}
              onClick={() => {
                // switch to quiz resume mode
                const raw = window.sessionStorage.getItem(SESSION_KEY);
                if (!raw) return;
                const s = JSON.parse(raw) as StudySession;
                saveLastSession({
                  version: 1,
                  mode: 'quiz',
                  gradeLabel: s.gradeLabel,
                  n: s.n,
                  itemIds: s.itemIds,
                  qIdx: 0,
                  startedAt: Date.now(),
                  updatedAt: Date.now(),
                });
              }}
            >
              퀴즈 시작
            </Link>
          </div>
          <div className="mt-3">
            <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/">
              홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-600 underline" href={reviewOnly || focusWeak ? "/progress" : "/"}>
          ← {reviewOnly || focusWeak ? '진도' : '급수 선택'}
        </Link>
        <div className="flex items-center gap-2">
          {(reviewOnly || focusWeak) && (
            <span
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-extrabold"
              style={{ background: 'rgba(14,165,233,0.12)' }}
            >
              {focusWeak ? '🎯 약점' : '🔁 복습'}
            </span>
          )}
          <div className="text-sm text-gray-600">
            {grade} · {idx + 1}/{items.length}
          </div>
        </div>
      </div>

      <div className="card p-6 text-center">
        <div className="text-6xl font-black tracking-wide">{current.hanja}</div>
        <div className="mt-4">
          {revealed ? (
            <>
              <div className="text-xl font-semibold">{current.meaning} {current.reading}</div>
              <div className="mt-2 text-sm text-gray-600">
                부수: {current.radical ?? '-'} · 획수: {current.totalStrokes ?? '-'}
              </div>
              {current.exampleWord && (
                <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                  예: <span className="font-extrabold">{current.exampleWord}</span>
                  {current.exampleMeaning ? ` · ${current.exampleMeaning}` : ''}
                </div>
              )}
            </>
          ) : (
            <button
              className="btn btn-primary focus-ring"
              onClick={() => setRevealed(true)}
            >
              뜻/음 보기
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="btn btn-ghost focus-ring flex-1"
          onClick={() => {
            setRevealed(false);
            setIdx((i) => Math.max(0, i - 1));
          }}
          disabled={idx === 0}
        >
          이전
        </button>
        <button
          className="btn btn-primary focus-ring flex-1"
          onClick={() => {
            setRevealed(false);
            setIdx((i) => {
              const next = i + 1;
              // persist resume progress
              const now = Date.now();
              const prev = loadLastSession();
              const startedAt = prev && prev.mode === 'study' ? prev.startedAt : now;
              saveLastSession({
                version: 1,
                mode: 'study',
                gradeLabel: grade,
                n,
                itemIds: items.map((x) => x.id),
                idx: next,
                startedAt,
                updatedAt: now,
              });
              return next;
            });
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
