'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Dino from '@/components/Dino';
import StickerBadge, { type Badge } from '@/components/StickerBadge';
import { GRADE_LABELS, kanjiByGradeLabel } from '@/lib/kanji';
import { loadState, saveState } from '@/lib/storage';
import type { GradeLabel } from '@/lib/types';

export default function HomePage() {
  const [dailyCount, setDailyCount] = useState<5 | 10 | 15>(5);
  const [streak, setStreak] = useState<{ count: number; lastStudyDate: string | null }>({
    count: 0,
    lastStudyDate: null,
  });

  useEffect(() => {
    const st = loadState();
    setDailyCount(st.settings.dailyCount);
    setStreak(st.streak);
  }, []);

  useEffect(() => {
    const st = loadState();
    st.settings.dailyCount = dailyCount;
    saveState(st);
  }, [dailyCount]);

  const gradeSummaries = useMemo(() => {
    const st = loadState();
    return GRADE_LABELS.map((label) => {
      const items = kanjiByGradeLabel(label);
      const mastered = items.filter((k) => st.progress[k.id]?.mastered).length;
      return { label, total: items.length, mastered };
    });
  }, []);

  const badges: Badge[] = useMemo(() => {
    const st = loadState();
    const streakCount = st.streak.count;
    const seenCount = Object.keys(st.progress || {}).length;
    return [
      { id: 'first', label: '첫 공부', emoji: '🦖', achieved: seenCount > 0 },
      { id: 'streak3', label: '연속 3일', emoji: '⭐', achieved: streakCount >= 3 },
      { id: 'streak7', label: '연속 7일', emoji: '🌈', achieved: streakCount >= 7 },
      { id: 'quiz50', label: '50문제', emoji: '🏅', achieved: false },
    ];
  }, []);

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-4">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">한자 공부</h1>
          <Dino className="text-2xl" />
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          어문회 8급~5급 · 키즈 모드
        </p>
      </header>

      <section className="card mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>오늘 목표</div>
            <div className="text-lg font-extrabold">{dailyCount}자</div>
          </div>
          <select
            className="focus-ring rounded-2xl border-2 px-3 py-2 font-extrabold"
            style={{ borderColor: 'rgba(2,132,199,0.18)', background: 'rgba(255,255,255,0.8)' }}
            value={dailyCount}
            onChange={(e) => setDailyCount(Number(e.target.value) as 5 | 10 | 15)}
          >
            <option value={5}>5자</option>
            <option value={10}>10자</option>
            <option value={15}>15자</option>
          </select>
        </div>

        <div className="mt-3 text-sm">
          <span className="font-bold">연속 학습:</span> {streak.count}일
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {badges.slice(0, 3).map((b) => (
            <StickerBadge key={b.id} badge={b} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {gradeSummaries.map(({ label, total, mastered }) => (
          <GradeCard key={label} label={label as GradeLabel} total={total} mastered={mastered} dailyCount={dailyCount} />
        ))}
      </section>

      <div className="mt-6 flex justify-between text-sm">
        <Link className="text-blue-700 underline" href="/progress">
          진도 보기
        </Link>
        <Link className="text-blue-700 underline" href="/about">
          안내
        </Link>
      </div>
    </main>
  );
}

function GradeCard(props: { label: GradeLabel; total: number; mastered: number; dailyCount: number }) {
  const { label, total, mastered, dailyCount } = props;
  const pct = total ? Math.round((mastered / total) * 100) : 0;

  return (
    <Link
      href={`/study?grade=${encodeURIComponent(label)}&n=${dailyCount}`}
      className="card p-3 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">{label}</div>
        <div className="text-xs text-gray-500">{pct}%</div>
      </div>
      <div className="mt-2 text-sm text-gray-600">마스터 {mastered}/{total}</div>
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}
