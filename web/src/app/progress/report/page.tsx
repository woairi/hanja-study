'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GRADE_LABELS, ALL_KANJI, kanjiByGradeLabel, todayKey } from '@/lib/kanji';
import { periodSummary, getWeakTop, gradeStats } from '@/lib/learningSummary';
import { loadState } from '@/lib/storage';

export default function WeeklyReportPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shared, setShared] = useState(false);

  const st = useMemo(() => loadState(), []);
  const now = Date.now();

  const summary = useMemo(() => periodSummary(st.stats, now, 7), [st, now]);
  const weakTop = useMemo(() => getWeakTop(st.progress, 3), [st]);
  const nickname = st.settings.nickname || '한자 키즈';

  const gradeProgress = useMemo(() => {
    return GRADE_LABELS.map((label) => {
      const items = kanjiByGradeLabel(label);
      const stats = gradeStats(items, st.progress, now);
      return { label, ...stats };
    }).filter((g) => g.seen > 0);
  }, [st, now]);

  const drawReport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const W = 600;
    const H = 400;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#f0f9ff');
    grad.addColorStop(0.5, '#e0f2fe');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 20);
    ctx.fill();

    // Title
    ctx.fillStyle = '#0c4a6e';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📊 ${nickname}의 주간 리포트`, W / 2, 45);

    // Date range
    const d = new Date(now);
    const end = `${d.getMonth() + 1}/${d.getDate()}`;
    const s = new Date(d);
    s.setDate(d.getDate() - 6);
    const start = `${s.getMonth() + 1}/${s.getDate()}`;
    ctx.fillStyle = '#0369a1';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${start} ~ ${end}`, W / 2, 70);

    // Stats boxes
    const stats = [
      { label: '학습일수', value: `${summary.studyDays}일`, emoji: '📅' },
      { label: '풀은 문제', value: `${summary.answered}개`, emoji: '📝' },
      { label: '정답률', value: summary.acc !== null ? `${summary.acc}%` : '—', emoji: '🎯' },
      { label: '연속 학습', value: `${st.streak.count}일`, emoji: '🔥' },
    ];

    const boxW = 120;
    const boxH = 70;
    const startX = (W - stats.length * boxW - (stats.length - 1) * 12) / 2;

    stats.forEach((s, i) => {
      const x = startX + i * (boxW + 12);
      const y = 90;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 12);
      ctx.fill();

      ctx.fillStyle = '#0c4a6e';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.emoji} ${s.label}`, x + boxW / 2, y + 22);

      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(s.value, x + boxW / 2, y + 52);
    });

    // Grade progress
    if (gradeProgress.length > 0) {
      ctx.fillStyle = '#0c4a6e';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('급수별 진도', 30, 200);

      gradeProgress.slice(0, 4).forEach((g, i) => {
        const y = 215 + i * 28;
        ctx.fillStyle = '#334155';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText(`${g.label}`, 30, y);
        ctx.fillText(`${g.mastered}/${g.total} 마스터`, 100, y);

        // Progress bar
        const barX = 230;
        const barW = 200;
        const barH = 12;
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(barX, y - 11, barW, barH, 6);
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(barX, y - 11, barW * (g.pct / 100), barH, 6);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText(`${g.pct}%`, barX + barW + 8, y);
      });
    }

    // Weak top
    if (weakTop.length > 0) {
      ctx.fillStyle = '#0c4a6e';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('💪 이번 주 약점', 30, 345);

      ctx.fillStyle = '#475569';
      ctx.font = '13px system-ui, sans-serif';
      const weakText = weakTop
        .map((w) => {
          const k = ALL_KANJI.find((x) => x.id === w.id);
          return k ? `${k.hanja}(${k.meaning})` : w.id;
        })
        .join('  ');
      ctx.fillText(weakText, 30, 365);
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('hanja-study.vercel.app 🐉', W / 2, H - 12);

    return canvas;
  }, [nickname, summary, st, gradeProgress, weakTop, now]);

  const handleShare = useCallback(async () => {
    const canvas = drawReport();
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      if (navigator.share) {
        const file = new File([blob], 'weekly-report.png', { type: 'image/png' });
        await navigator.share({
          title: `${nickname}의 주간 리포트`,
          text: `📊 이번 주 학습: ${summary.studyDays}일, 정답률 ${summary.acc ?? 0}%`,
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `weekly-report-${todayKey()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch {
      // user cancelled share
    }
  }, [drawReport, nickname, summary]);

  const handleDownload = useCallback(async () => {
    const canvas = drawReport();
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${todayKey()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [drawReport]);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-700 underline" href="/progress">
          ← 진도
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          주간 리포트
        </div>
      </div>

      <Card className="p-4 text-center">
        <h1 className="text-xl font-extrabold">📊 주간 리포트</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          이번 주 학습 현황을 이미지로 저장하거나 공유할 수 있어!
        </p>

        <canvas
          ref={canvasRef}
          className="mx-auto mt-4 w-full max-w-[300px] rounded-xl"
          style={{ aspectRatio: '3/2' }}
        />

        <div className="mt-4 flex gap-2">
          <Button variant="primary" className="flex-1" onClick={handleShare}>
            {shared ? '공유 완료! ✅' : '공유하기 📤'}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={handleDownload}>
            저장하기 💾
          </Button>
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <div className="text-sm font-extrabold">이번 주 요약</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>📅 학습일수: <span className="font-extrabold">{summary.studyDays}일</span></div>
          <div>📝 풀은 문제: <span className="font-extrabold">{summary.answered}개</span></div>
          <div>🎯 정답률: <span className="font-extrabold">{summary.acc !== null ? `${summary.acc}%` : '—'}</span></div>
          <div>🔥 연속 학습: <span className="font-extrabold">{st.streak.count}일</span></div>
        </div>
      </Card>
    </main>
  );
}
