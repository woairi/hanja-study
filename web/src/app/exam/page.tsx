'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GRADE_LABELS } from '@/lib/kanji';
import { getBlueprint, type ExamMode, type ExamType, examTypeLabel } from '@/lib/exam/generator';
import type { GradeLabel } from '@/lib/types';

const EXAM_TYPES: ExamType[] = ['read_hanja', 'meaning_reading', 'write_hanja', 'radical_strokes', 'antonym_synonym', 'idiom', 'matching'];

export default function ExamHomePage() {
  const [grade, setGrade] = useState<GradeLabel>('8급');
  const [mode, setMode] = useState<ExamMode>('quick');
  const [typeFilter, setTypeFilter] = useState<ExamType | null>(null);

  const bp = useMemo(() => getBlueprint(grade), [grade]);

  const questionCount = mode === 'quick' ? bp.quickCount : mode === 'full' ? bp.questionCount : 10;

  const href = useMemo(() => {
    const params = new URLSearchParams({ grade, mode });
    if (mode === 'type_practice' && typeFilter) {
      params.set('type', typeFilter);
    }
    return `/exam/session?${params.toString()}`;
  }, [grade, mode, typeFilter]);

  return (
    <main className="mx-auto max-w-md p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-700 underline" href="/">
          ← 홈
        </Link>
        <Link className="text-sm text-blue-700 underline" href="/exam/history">
          📋 이력
        </Link>
      </div>

      <h1 className="text-xl font-extrabold">🏆 급수 도전</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        실제 시험과 같은 유형으로 실력을 확인해봐!
      </p>

      {/* 급수 선택 */}
      <Card className="mt-4 p-4">
        <div className="text-sm font-extrabold">1. 급수 선택</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {GRADE_LABELS.map((g) => (
            <button
              key={g}
              className={`focus-ring rounded-xl px-3 py-2 text-sm font-extrabold transition-colors ${
                grade === g ? 'text-white' : ''
              }`}
              style={{
                background: grade === g ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                color: grade === g ? 'white' : 'var(--text)',
              }}
              onClick={() => setGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          합격 기준: {bp.passScore}점 이상
        </div>
      </Card>

      {/* 도전 방식 */}
      <Card className="mt-3 p-4">
        <div className="text-sm font-extrabold">2. 도전 방식</div>
        <div className="mt-2 space-y-2">
          {([
            { value: 'quick' as const, emoji: '⚡', label: '빠른 도전', desc: `${bp.quickCount}문항 · 약 5분` },
            { value: 'full' as const, emoji: '📝', label: '실전 도전', desc: `${bp.questionCount}문항 · 실제 시험과 동일` },
            { value: 'type_practice' as const, emoji: '🎯', label: '유형 훈련', desc: '원하는 유형만 집중 연습' },
          ]).map((opt) => (
            <button
              key={opt.value}
              className={`focus-ring w-full rounded-xl px-4 py-3 text-left transition-colors ${
                mode === opt.value ? 'ring-2' : ''
              }`}
              style={{
                background: mode === opt.value ? 'rgba(2,132,199,0.08)' : 'rgba(255,255,255,0.7)',
              }}
              onClick={() => setMode(opt.value)}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{opt.emoji}</span>
                <div>
                  <div className="text-sm font-extrabold">{opt.label}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{opt.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 유형 훈련 선택 */}
      {mode === 'type_practice' && (
        <Card className="mt-3 p-4">
          <div className="text-sm font-extrabold">3. 유형 선택</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAM_TYPES.map((t) => (
              <button
                key={t}
                className={`focus-ring rounded-xl px-3 py-2 text-sm font-extrabold transition-colors ${
                  typeFilter === t ? 'text-white' : ''
                }`}
                style={{
                  background: typeFilter === t ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                  color: typeFilter === t ? 'white' : 'var(--text)',
                }}
                onClick={() => setTypeFilter(t)}
              >
                {examTypeLabel(t)}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* 요약 */}
      <Card className="mt-3 p-4 text-center">
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          {grade} · {mode === 'quick' ? '빠른 도전' : mode === 'full' ? '실전 도전' : `유형 훈련 (${typeFilter ? examTypeLabel(typeFilter) : '선택해줘'})`} · {questionCount}문항
        </div>
      </Card>

      {/* 하단 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t" style={{ background: 'rgba(240,249,255,0.94)', borderColor: 'rgba(2,132,199,0.12)' }}>
        <div className="mx-auto w-full max-w-md p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link
            href={href}
            className={`btn btn-primary focus-ring inline-flex w-full items-center justify-center text-base ${
              mode === 'type_practice' && !typeFilter ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            도전 시작! 🚀
          </Link>
        </div>
      </div>
    </main>
  );
}
