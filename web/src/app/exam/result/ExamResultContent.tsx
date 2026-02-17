'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shared, setShared] = useState(false);

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

  const drawAndShare = useCallback(async () => {
    if (!payload) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 600, H = 400;
    canvas.width = W;
    canvas.height = H;

    // 배경
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#e0f2fe');
    bg.addColorStop(1, '#bae6fd');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 타이틀
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(passed ? '🎊 합격!' : '💪 도전 완료!', W / 2, 50);

    // 급수
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${grade} 급수 도전`, W / 2, 85);

    // 점수 원형
    const cx = W / 2, cy = 190, r = 65;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.fillStyle = pct >= 70 ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(`${pct}%`, cx, cy + 12);
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${payload.score}/${payload.total}`, cx, cy + 35);

    // 유형별
    const types = typeChartData;
    if (types.length > 0) {
      const startX = 60;
      const barW = (W - 120) / types.length;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < types.length; i++) {
        const x = startX + barW * i + barW / 2;
        const barH = Math.max(4, (types[i].value / 100) * 80);
        ctx.fillStyle = types[i].value >= 70 ? '#22c55e' : '#f59e0b';
        ctx.fillRect(x - 15, 320 - barH, 30, barH);
        ctx.fillStyle = '#475569';
        ctx.fillText(types[i].label, x, 340);
        ctx.fillText(`${types[i].value}%`, x, 320 - barH - 6);
      }
    }

    // 워터마크
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('hanja-study.vercel.app', W - 16, H - 12);

    // 공유
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob && navigator.canShare?.({ files: [new File([blob], 'exam.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `${grade} 급수 도전 결과`,
          text: `${grade} ${pct}% ${passed ? '합격!' : '도전 완료'} — 한자 공부`,
          files: [new File([blob], 'exam-result.png', { type: 'image/png' })],
        });
      } else {
        // fallback: 텍스트만
        await navigator.share?.({
          title: `${grade} 급수 도전 결과`,
          text: `${grade} ${pct}% (${payload.score}/${payload.total}) ${passed ? '합격!' : '도전 완료'} — hanja-study.vercel.app`,
        });
      }
      setShared(true);
    } catch {
      // 사용자가 취소
    }
  }, [payload, passed, pct, grade, typeChartData]);

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

      {/* 숨겨진 canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t" style={{ background: 'rgba(240,249,255,0.94)', borderColor: 'rgba(2,132,199,0.12)' }}>
        <div className="mx-auto flex w-full max-w-md gap-2 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link href={`/exam/session?grade=${encodeURIComponent(grade)}&mode=quick`} className="btn btn-primary focus-ring inline-flex flex-1 items-center justify-center">다시 도전 🔄</Link>
          <button onClick={drawAndShare} className="btn btn-ghost focus-ring inline-flex flex-1 items-center justify-center">
            {shared ? '공유 완료 ✅' : '공유 📤'}
          </button>
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
