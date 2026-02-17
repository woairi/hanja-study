'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { MiniBarChart } from '@/components/ui/MiniBarChart';
import { isPass, examTypeLabel, type ExamType } from '@/lib/exam/generator';
import { ALL_KANJI } from '@/lib/kanji';
import { loadState, xpProgress } from '@/lib/storage';
import type { GradeLabel, KanjiItem } from '@/lib/types';

const EXAM_RESULT_KEY = 'hanja-study:examResult';

const XP_PER_QUESTION = 2;
const XP_PASS_BONUS = 30;

type ExamResultPayload = {
  grade: GradeLabel;
  mode: string;
  score: number;
  total: number;
  passed?: boolean;
  byType: Record<string, { correct: number; total: number }>;
  wrongKanjiIds: string[];
  finishedAt: number;
};

export default function ExamResultContent() {
  const sp = useSearchParams();
  const grade = (sp.get('grade') || '8급') as GradeLabel;
  const [payload, setPayload] = useState<ExamResultPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(EXAM_RESULT_KEY);
      if (raw) setPayload(JSON.parse(raw));
    } catch { /* */ }
  }, []);

  const passed = useMemo(() => {
    if (!payload) return false;
    return isPass(payload.score, payload.total, grade);
  }, [payload, grade]);

  const pct = useMemo(() => {
    if (!payload || payload.total === 0) return 0;
    return Math.round((payload.score / payload.total) * 100);
  }, [payload]);

  const typeChartData = useMemo(() => {
    if (!payload) return [];
    return Object.entries(payload.byType).map(([type, stat]) => ({
      label: examTypeLabel(type as ExamType),
      value: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
    }));
  }, [payload]);

  const wrongItems = useMemo(() => {
    if (!payload) return [];
    const map = new Map(ALL_KANJI.map((k) => [k.id, k]));
    return payload.wrongKanjiIds
      .map((id) => map.get(id))
      .filter((x): x is KanjiItem => !!x)
      .slice(0, 10);
  }, [payload]);

  if (!payload) {
    return (
      <main className="mx-auto max-w-md p-4 text-center">
        <Link href="/exam" className="text-sm text-blue-700 underline">← 급수 도전</Link>
        <div className="mt-8 text-sm" style={{ color: 'var(--muted)' }}>
          결과를 찾을 수 없어. 다시 도전해보자!
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-700 underline" href="/exam">← 급수 도전</Link>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>결과</div>
      </div>

      <Card className="p-5 text-center">
        <div className="text-5xl">{passed ? '🎊' : '💪'}</div>
        <h1 className="mt-2 text-2xl font-extrabold">{passed ? '합격!' : '아쉽지만 다음에!'}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          {passed ? `${grade} 급수 도전 통과! 대단해!` : `${grade} 기준 ${pct}% — 조금만 더 하면 합격이야!`}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-left">
          <div className="rounded-2xl bg-white/70 px-3 py-3">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>점수</div>
            <div className="mt-1 text-lg font-extrabold">{payload.score}<span className="text-xs" style={{ color: 'var(--muted)' }}> / {payload.total}</span></div>
          </div>
          <div className="rounded-2xl bg-white/70 px-3 py-3">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>정답률</div>
            <div className="mt-1 text-lg font-extrabold">{pct}%</div>
          </div>
          <div className="rounded-2xl bg-white/70 px-3 py-3">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>합격선</div>
            <div className="mt-1 text-lg font-extrabold">70%</div>
          </div>
        </div>
      </Card>

      {typeChartData.length > 0 && (
        <Card className="mt-3 p-4">
          <div className="text-sm font-extrabold">유형별 정답률</div>
          <div className="mt-2">
            <MiniBarChart data={typeChartData} height={60} barColor="var(--primary)" highlightColor="var(--primary-600)" />
          </div>
          <div className="mt-2 space-y-1">
            {typeChartData.map((d) => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <span>{d.label}</span>
                <span className="font-extrabold" style={{ color: d.value >= 70 ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {wrongItems.length > 0 && (
        <Card className="mt-3 p-4">
          <div className="text-sm font-extrabold">오답 노트</div>
          <div className="mt-2 space-y-2">
            {wrongItems.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2">
                <span className="text-xl font-extrabold">{k.hanja}</span>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{k.meaning} · {k.reading}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* XP 획득 */}
      <XpCard score={payload.score} passed={passed} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t" style={{ background: 'rgba(240,249,255,0.94)', borderColor: 'rgba(2,132,199,0.12)' }}>
        <div className="mx-auto flex w-full max-w-md gap-2 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link href={`/exam/session?grade=${encodeURIComponent(grade)}&mode=quick`} className="btn btn-primary focus-ring inline-flex flex-1 items-center justify-center">다시 도전 🔄</Link>
          <Link href="/exam" className="btn btn-ghost focus-ring inline-flex flex-1 items-center justify-center">급수 변경</Link>
        </div>
      </div>
    </main>
  );
}

/** XP 획득 카드 */
function XpCard({ score, passed }: { score: number; passed: boolean }) {
  const earnedXp = score * XP_PER_QUESTION + (passed ? XP_PASS_BONUS : 0);
  const st = loadState();
  const xp = xpProgress(st.gamification?.xpTotal || 0);
  const badges = st.gamification?.badges || [];

  return (
    <Card className="mt-3 p-4">
      <div className="text-sm font-extrabold">⭐ 경험치</div>
      <div className="mt-2 flex items-center gap-3">
        <div className="text-2xl font-extrabold" style={{ color: 'var(--primary)' }}>+{earnedXp} XP</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          {passed && '🎖️ 합격 보너스 +30 '}
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold">Lv.{xp.level}</span>
          <span style={{ color: 'var(--muted)' }}>{xp.current}/{xp.needed} XP</span>
        </div>
        <div className="mt-1 h-2 w-full rounded bg-gray-200">
          <div className="h-2 rounded transition-all" style={{ width: `${xp.pct}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />
        </div>
      </div>
      {badges.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>획득 뱃지</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b} className="rounded-lg px-2 py-1 text-xs font-extrabold" style={{ background: 'rgba(251,191,36,0.2)', color: '#b45309' }}>
                🏅 {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
