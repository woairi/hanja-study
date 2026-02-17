'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { loadState, xpProgress } from '@/lib/storage';
import type { ExamRecord } from '@/lib/types';

export default function ExamHistoryPage() {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [xp, setXp] = useState({ level: 1, current: 0, needed: 100, pct: 0 });

  useEffect(() => {
    const st = loadState();
    setRecords([...(st.examHistory || [])].reverse());
    setBadges(st.gamification?.badges || []);
    setXp(xpProgress(st.gamification?.xpTotal || 0));
  }, []);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-700 underline" href="/exam">← 급수 도전</Link>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>도전 이력</div>
      </div>

      <h1 className="text-xl font-extrabold">📋 도전 이력</h1>

      {/* 뱃지 + 레벨 */}
      <Card className="mt-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold">Lv.{xp.level}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{xp.current}/{xp.needed} XP</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold">{records.filter((r) => r.passed).length}회 합격</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>총 {records.length}회 도전</div>
          </div>
        </div>
        <div className="mt-2 h-2 w-full rounded bg-gray-200">
          <div className="h-2 rounded transition-all" style={{ width: `${xp.pct}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />
        </div>
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b} className="rounded-lg px-2 py-1 text-xs font-extrabold" style={{ background: 'rgba(251,191,36,0.2)', color: '#b45309' }}>
                🏅 {b}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 이력 목록 */}
      {records.length === 0 ? (
        <div className="mt-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
          아직 도전 기록이 없어. 첫 도전을 해보자! 🚀
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {records.map((r, i) => {
            const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
            const date = new Date(r.finishedAt);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

            return (
              <Card key={`${r.finishedAt}-${i}`} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{r.passed ? '✅' : '❌'}</span>
                    <div>
                      <div className="text-sm font-extrabold">{r.grade} {r.mode === 'quick' ? '빠른' : r.mode === 'full' ? '실전' : '유형'}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{dateStr}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold">{r.score}/{r.total}</div>
                    <div className="text-xs font-extrabold" style={{ color: pct >= 70 ? '#22c55e' : '#ef4444' }}>{pct}%</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
