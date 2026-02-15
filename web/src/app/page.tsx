'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Dino from '@/components/Dino';
import Modal from '@/components/Modal';
import StickerBadge, { type Badge } from '@/components/StickerBadge';
import { GRADE_LABELS, kanjiByGradeLabel } from '@/lib/kanji';
import { loadState, saveState } from '@/lib/storage';
import { loadLastSession, type LastSession } from '@/lib/session';
import type { GradeLabel } from '@/lib/types';

export default function HomePage() {
  const [dailyCount, setDailyCount] = useState<5 | 10 | 15>(5);
  const [lastGrade, setLastGrade] = useState<GradeLabel>('8급');
  const [streak, setStreak] = useState<{ count: number; lastStudyDate: string | null }>({
    count: 0,
    lastStudyDate: null,
  });
  const [badgeModal, setBadgeModal] = useState<Badge | null>(null);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);

  // collapsibles (progressive disclosure)
  const [showGrades, setShowGrades] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    const st = loadState();
    setDailyCount(st.settings.dailyCount);
    setLastGrade((st.settings.lastGradeLabel as GradeLabel) || '8급');
    setStreak(st.streak);
    setLastSession(loadLastSession());

    // restore collapsible prefs
    try {
      const raw = window.localStorage.getItem('hanja-study:home:ui');
      if (raw) {
        const ui = JSON.parse(raw) as { showGrades?: boolean; showGoals?: boolean };
        setShowGrades(!!ui.showGrades);
        setShowGoals(!!ui.showGoals);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const st = loadState();
    st.settings.dailyCount = dailyCount;
    st.settings.lastGradeLabel = lastGrade;
    saveState(st);
  }, [dailyCount, lastGrade]);

  useEffect(() => {
    try {
      window.localStorage.setItem('hanja-study:home:ui', JSON.stringify({ showGrades, showGoals }));
    } catch {
      // ignore
    }
  }, [showGrades, showGoals]);

  const gradeSummaries = useMemo(() => {
    const st = loadState();
    return GRADE_LABELS.map((label) => {
      const items = kanjiByGradeLabel(label);
      const mastered = items.filter((k) => st.progress[k.id]?.mastered).length;
      return { label, total: items.length, mastered };
    });
  }, []);

  const reviewInfo = useMemo(() => {
    const st = loadState();
    const now = Date.now();
    let totalDue = 0;
    let best: { label: GradeLabel; due: number } | null = null;

    for (const label of GRADE_LABELS) {
      const items = kanjiByGradeLabel(label);
      const due = items.filter((k) => {
        const p = st.progress[k.id];
        return p && !p.mastered && p.nextReviewAt <= now;
      }).length;
      totalDue += due;
      if (!best || due > best.due) best = { label, due };
    }

    const dailyCount = st.settings.dailyCount;
    const target = best?.label ?? '8급';
    const href = `/study?grade=${encodeURIComponent(target)}&n=${Math.min(10, dailyCount)}&review=1`;

    return { totalDue, target, href };
  }, []);

  const badges: Badge[] = useMemo(() => {
    const st = loadState();
    const streakCount = st.streak.count;
    const seenCount = Object.keys(st.progress || {}).length;
    const quizAnswered = st.stats?.quizAnswered || 0;
    return [
      { id: 'first', label: '첫 공부', emoji: '🦖', achieved: seenCount > 0 },
      { id: 'streak3', label: '연속 3일', emoji: '⭐', achieved: streakCount >= 3 },
      { id: 'streak7', label: '연속 7일', emoji: '🌈', achieved: streakCount >= 7 },
      { id: 'quiz50', label: '퀴즈 50문제', emoji: '🏅', achieved: quizAnswered >= 50 },
    ];
  }, []);

  const badgeDesc: Record<string, string> = {
    first: '첫 한자를 공부했어! 시작이 반이야.',
    streak3: '3일 연속 성공! 꾸준함이 실력이야.',
    streak7: '7일 연속 성공! 공룡처럼 강해지고 있어.',
    quiz50: '퀴즈 50문제 돌파! 실력이 쑥쑥.',
  };

  const primary = useMemo(() => {
    // Primary CTA: resume if exists, else review if due, else learn.
    if (lastSession) {
      return {
        kind: 'resume' as const,
        title: '이어하기',
        subtitle: `${lastSession.gradeLabel} · ${lastSession.mode === 'study' ? '학습' : '퀴즈'}`,
        href: '/resume',
        cta: '계속',
      };
    }
    if (reviewInfo.totalDue > 0) {
      return {
        kind: 'review' as const,
        title: '복습 먼저 하기',
        subtitle: `복습 ${reviewInfo.totalDue}개 · ${reviewInfo.target}`,
        href: reviewInfo.href,
        cta: '복습',
      };
    }
    return {
      kind: 'learn' as const,
      title: '오늘의 새 한자',
      subtitle: `${lastGrade} · ${dailyCount}자`,
      href: `/study?grade=${encodeURIComponent(lastGrade)}&n=${dailyCount}`,
      cta: '시작',
    };
  }, [lastSession, reviewInfo.totalDue, reviewInfo.target, reviewInfo.href, lastGrade, dailyCount]);

  // Secondary CTAs: keep at most 2
  const secondary = useMemo(() => {
    const learn = {
      title: '새 한자',
      subtitle: `${lastGrade} · ${dailyCount}자`,
      href: `/study?grade=${encodeURIComponent(lastGrade)}&n=${dailyCount}`,
      icon: '📚',
      disabled: false,
    };
    const review = {
      title: '복습',
      subtitle: reviewInfo.totalDue > 0 ? `${Math.min(10, dailyCount)}개까지 · ${reviewInfo.target}` : '대기 없음',
      href: reviewInfo.totalDue > 0 ? reviewInfo.href : '#',
      icon: '🔁',
      disabled: reviewInfo.totalDue <= 0,
    };

    // if primary is review, show learn as main secondary; otherwise show review.
    if (primary.kind === 'review') return [learn];
    if (primary.kind === 'learn') return [review];
    // resume: show both
    return [learn, review];
  }, [primary.kind, lastGrade, dailyCount, reviewInfo.totalDue, reviewInfo.target, reviewInfo.href]);

  return (
    <main className="mx-auto max-w-md p-4">
      {/* Header */}
      <header className="mb-3">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">한자 공부</h1>
          <Dino className="text-2xl" />
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            🔥 {streak.count}일 · 🎯 {dailyCount}자 · 🔁 {reviewInfo.totalDue}개
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={() => setShowGoals((v) => !v)}
            >
              목표/뱃지 {showGoals ? '▴' : '▾'}
            </button>
            <button
              type="button"
              className="btn btn-ghost focus-ring px-3 py-2 text-xs"
              onClick={() => setShowGrades((v) => !v)}
            >
              급수 {showGrades ? '▴' : '▾'}
            </button>
          </div>
        </div>
      </header>

      {/* Primary CTA (Hero) */}
      <section className="card mb-3 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold" style={{ color: 'var(--muted)' }}>
              {primary.title}
            </div>
            <div className="mt-1 text-base font-extrabold">{primary.subtitle}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              {primary.kind === 'resume'
                ? '(바로 이어서 계속)'
                : primary.kind === 'review'
                  ? '복습부터 하면 기억이 더 잘 남아.'
                  : '오늘 분량만 딱 끝내자.'}
            </div>
          </div>
          <Link className="btn btn-primary focus-ring inline-flex items-center justify-center" href={primary.href}>
            {primary.cta}
          </Link>
        </div>
      </section>

      {/* Today actions (Secondary) */}
      <section className="mb-3 grid grid-cols-2 gap-3">
        {secondary.map((a) => (
          <Link
            key={a.title}
            href={a.disabled ? '#' : a.href}
            onClick={(e) => {
              if (a.disabled) e.preventDefault();
            }}
            aria-disabled={a.disabled}
            className={`card p-3 ${a.disabled ? 'opacity-60' : 'active:scale-[0.99]'}`}
          >
            <div className="text-lg" aria-hidden>
              {a.icon}
            </div>
            <div className="mt-1 text-sm font-extrabold">{a.title}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
              {a.subtitle}
            </div>
          </Link>
        ))}
      </section>

      {/* Collapsible: goals/badges */}
      {showGoals && (
        <section className="card mb-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                오늘 목표
              </div>
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
            {badges.map((b) => (
              <StickerBadge key={b.id} badge={b} onClick={(bb) => setBadgeModal(bb)} />
            ))}
          </div>
        </section>
      )}

      {/* Collapsible: grades */}
      {showGrades && (
        <section className="card mb-3 p-4">
          <div className="text-sm font-extrabold" style={{ color: 'var(--muted)' }}>
            급수 선택
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {gradeSummaries.map(({ label, total, mastered }) => (
              <GradeCard
                key={label}
                label={label as GradeLabel}
                total={total}
                mastered={mastered}
                dailyCount={dailyCount}
                onPickGrade={(g) => setLastGrade(g)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex justify-between text-sm">
        <Link className="text-blue-700 underline" href="/progress">
          진도 보기
        </Link>
        <Link className="text-blue-700 underline" href="/about">
          안내
        </Link>
      </div>

      <Modal
        open={!!badgeModal}
        title={badgeModal ? `${badgeModal.emoji} ${badgeModal.label}` : '뱃지'}
        onClose={() => setBadgeModal(null)}
      >
        <div className="space-y-2">
          <div>{badgeModal ? badgeDesc[badgeModal.id] : ''}</div>
          {badgeModal && (
            <div className="text-sm">
              상태:{' '}
              <span className={badgeModal.achieved ? 'font-extrabold text-green-700' : 'font-extrabold text-gray-600'}>
                {badgeModal.achieved ? '달성!' : '아직 미달성'}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </main>
  );
}

function GradeCard(props: {
  label: GradeLabel;
  total: number;
  mastered: number;
  dailyCount: number;
  onPickGrade: (g: GradeLabel) => void;
}) {
  const { label, total, mastered, dailyCount, onPickGrade } = props;
  const pct = total ? Math.round((mastered / total) * 100) : 0;
  const dino = gradeDino(label);

  return (
    <Link
      href={`/study?grade=${encodeURIComponent(label)}&n=${dailyCount}`}
      onClick={() => onPickGrade(label)}
      className="card p-3 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-extrabold">{label}</div>
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-base" style={{ opacity: 0.9 }}>
            {dino}
          </span>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            {pct}%
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
        마스터 {mastered}/{total}
      </div>
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div
          className="h-2 rounded"
          style={{ width: `${pct}%`, background: 'linear-gradient(180deg, var(--primary), var(--primary-600))' }}
        />
      </div>
    </Link>
  );
}

function gradeDino(label: GradeLabel): string {
  // Keep exactly ONE icon per grade for visual simplicity.
  switch (label) {
    case '8급':
      return '🥚';
    case '7급':
      return '🦕';
    case '7급Ⅱ':
      return '🦖';
    case '6급':
      return '🦖';
    case '6급Ⅱ':
      return '🐲';
    case '5급':
      return '👑';
    case '4급':
      return '🦖';
    case '4급Ⅱ':
      return '🧠';
    default:
      return '🦖';
  }
}
