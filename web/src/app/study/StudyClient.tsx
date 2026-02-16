'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ALL_KANJI } from '@/lib/kanji';
import type { GradeLabel, KanjiItem } from '@/lib/types';
import { bumpStreakOnStudy, loadState, saveState } from '@/lib/storage';
import { pickStudyItems } from '@/lib/selection';
import { loadLastSession, saveLastSession } from '@/lib/session';
import { logEvent } from '@/lib/telemetry';
import { pickOne } from '@/lib/copy';
import { todayKey } from '@/lib/kanji';
import { useSwipe } from '@/lib/useSwipe';
import { feedbackCelebrate } from '@/lib/feedback';

type StudySession = {
  gradeLabel: GradeLabel;
  n: 5 | 10 | 15;
  itemIds: string[];
  startedAt: number;
};

const SESSION_KEY = 'hanja-study:session';
const QUIZ_ID = 'session';
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
    // Back-compat: also write the legacy key.
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.setItem(`hanja-study:session:${QUIZ_ID}`, JSON.stringify(session));

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

  // 학습 완료 시 축하 피드백
  useEffect(() => {
    if (isDone && items.length > 0) feedbackCelebrate();
  }, [isDone, items.length]);
  const reviewOnly = sp.get('review') === '1';
  const focusWeak = sp.get('focus') === 'weak';

  const goPrev = useCallback(() => {
    if (idx === 0) return;
    setRevealed(false);
    setIdx((i) => Math.max(0, i - 1));
  }, [idx]);

  const goNext = useCallback(() => {
    setRevealed(false);
    setIdx((i) => {
      const next = i + 1;
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
  }, [grade, n, items]);

  const swipeHandlers = useSwipe((dir) => {
    if (dir === 'left') goNext();
    else goPrev();
  });

  const quizHref = `/quiz/${QUIZ_ID}?grade=${encodeURIComponent(grade)}&n=${n}`;

  if (!items.length) {
    return (
      <main className="mx-auto max-w-md p-4">
        <div className="text-sm text-gray-600">로딩중…</div>
      </main>
    );
  }

  if (isDone) {
    const st = loadState();
    const streakCount = st.streak.count;
    const quizAnswered = st.stats?.quizAnswered || 0;

    const achieved = {
      first: Object.keys(st.progress || {}).length > 0,
      streak3: streakCount >= 3,
      streak7: streakCount >= 7,
      quiz50: quizAnswered >= 50,
    };

    const nextBadgeHint = (() => {
      if (!achieved.streak3) return `다음 뱃지: ⭐ 연속 3일 (${streakCount}/3)`;
      if (!achieved.streak7) return `다음 뱃지: 🌈 연속 7일 (${streakCount}/7)`;
      if (!achieved.quiz50) return `다음 뱃지: 🏅 퀴즈 50문제 (${quizAnswered}/50)`;
      return '모든 뱃지를 모았어! 🎉';
    })();

    const weakIds = (() => {
      const now = Date.now();
      const itemsInGrade = ALL_KANJI.filter((k) => k.gradeLabel === grade);

      // 1) due-first (review debt)
      const due = itemsInGrade
        .filter((k) => {
          const p = st.progress[k.id];
          return p && !p.mastered && p.nextReviewAt <= now;
        })
        .slice(0, 20) // keep stable enough
        .map((k) => k.id);

      // 2) weak-next (error-prone)
      const rows = itemsInGrade
        .map((k) => {
          const p = st.progress[k.id];
          const wrong = p?.wrong || 0;
          const correct = p?.correct || 0;
          return { id: k.id, score: wrong - correct, wrong };
        })
        .filter((r) => r.wrong > 0)
        .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.wrong - a.wrong))
        .map((r) => r.id);

      const picked: string[] = [];
      const seen = new Set<string>();
      for (const id of due) {
        if (seen.has(id)) continue;
        picked.push(id);
        seen.add(id);
        if (picked.length >= 6) break;
      }
      for (const id of rows) {
        if (seen.has(id)) continue;
        picked.push(id);
        seen.add(id);
        if (picked.length >= 10) break;
      }
      return picked;
    })();

    // focus/review mode: no quiz
    if (reviewOnly || focusWeak) {
      // log done
      logEvent('review_done', { kind: focusWeak ? 'weak' : 'review', grade });

      const title = focusWeak ? '약점 복습 완료!' : '복습 완료!';
      const msg = pickOne(
        focusWeak
          ? ['약점만 빠르게 정리했어.', '어려운 것만 콕 집어서 끝!', '오늘의 약점 미션 클리어!']
          : ['오늘 복습할 게 다 끝났어.', '복습 완료! 기억이 더 단단해졌어.', '복습까지 끝냈다! 멋져.'],
        `${todayKey()}|review|${grade}|${focusWeak ? 'weak' : 'due'}`
      );

      return (
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
          <div className="card w-full p-6">
            <div className="text-4xl">✅</div>
            <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              {msg}
            </p>

            <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-left text-sm">
              <div className="font-extrabold">오늘의 성과</div>
              <div className="mt-1" style={{ color: 'var(--muted)' }}>
                🔥 연속 {streakCount}일
              </div>
              <div className="mt-1" style={{ color: 'var(--muted)' }}>
                {nextBadgeHint}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {weakIds.length > 0 && (
                <Link
                  className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
                  href={`/study?grade=${encodeURIComponent(grade)}&n=${10}&focus=weak`}
                  onClick={() => {
                    logEvent('post_done_weak_review_click', { from: focusWeak ? 'weak_done' : 'review_done', grade });
                    window.sessionStorage.setItem(FOCUS_KEY, JSON.stringify(weakIds));
                  }}
                >
                  약점 10개 더 복습
                </Link>
              )}
              <Link className="btn btn-primary focus-ring inline-flex w-full items-center justify-center" href="/progress">
                진도 보기
              </Link>
              <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/">
                홈으로
              </Link>
            </div>
          </div>
        </main>
      );
    }

    // log learning done
    logEvent('study_done', { grade, n });

    const learnMsg = pickOne(
      ['퀴즈로 한 번 더 확인하자.', '바로 퀴즈로 가서 실력을 확인해봐.', '퀴즈까지 하면 완벽!'],
      `${todayKey()}|study|${grade}|${n}`
    );

    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-4 text-center">
        <div className="card w-full p-6">
          <div className="text-4xl">🎉</div>
          <h1 className="mt-2 text-2xl font-extrabold">학습 완료!</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {learnMsg}
          </p>

          <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-left text-sm">
            <div className="font-extrabold">오늘의 성과</div>
            <div className="mt-1" style={{ color: 'var(--muted)' }}>
              🔥 연속 {streakCount}일
            </div>
            <div className="mt-1" style={{ color: 'var(--muted)' }}>
              {nextBadgeHint}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Link
              className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
              href={quizHref}
              data-testid="study-quiz-start"
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

      <div className="card p-6 text-center" {...swipeHandlers}>
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
              data-testid="study-reveal"
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
          onClick={goPrev}
          disabled={idx === 0}
        >
          이전
        </button>
        <button
          className="btn btn-primary focus-ring flex-1"
          data-testid="study-next"
          onClick={goNext}
        >
          다음
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        팁: 한자를 보고, 뜻/음을 떠올린 다음에 &ldquo;보기&rdquo;를 눌러. 👈👉 스와이프로도 넘길 수 있어!
      </div>
    </main>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function idToItem(id: string): KanjiItem | undefined {
  return ALL_KANJI.find((k) => k.id === id);
}
