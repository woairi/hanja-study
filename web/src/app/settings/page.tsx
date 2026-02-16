'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Dino from '@/components/Dino';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QUIZ_RESULT_TTL_MS, loadQuizResult } from '@/lib/quizResult';
import { clearAllLocalState, loadState, saveState } from '@/lib/storage';
import { useTheme, type ThemeMode } from '@/lib/useTheme';
import type { GradeLabel } from '@/lib/types';

const GRADE_CHOICES: GradeLabel[] = ['8급', '7급', '7급Ⅱ', '6급', '6급Ⅱ', '5급', '4급', '4급Ⅱ'];
const DAILY_CHOICES: Array<5 | 10 | 15> = [5, 10, 15];

export default function SettingsPage() {
  const router = useRouter();

  const initial = useMemo(() => {
    const st = loadState();
    const recentResult = loadQuizResult();

    const quizAnsweredAllTime = st.stats?.quizAnswered || 0;
    const hasDaily = Object.keys(st.stats.daily || {}).length > 0;

    return {
      nickname: st.settings.nickname || '',
      dailyCount: (st.settings.dailyCount || 5) as 5 | 10 | 15,
      lastGradeLabel: (st.settings.lastGradeLabel as GradeLabel) || '8급',
      onboardingCompleted: !!st.settings.onboardingCompleted,
      progressCount: Object.keys(st.progress || {}).length,
      lastStudyDate: st.streak.lastStudyDate,
      recentResultAt: recentResult?.finishedAt ?? null,
      hasRecentResult: !!recentResult,
      isLegacyNoDaily: quizAnsweredAllTime > 0 && !hasDaily,
    };
  }, []);

  const [nickname, setNickname] = useState(initial.nickname);
  const [dailyCount, setDailyCount] = useState<5 | 10 | 15>(initial.dailyCount);
  const [lastGrade, setLastGrade] = useState<GradeLabel>(initial.lastGradeLabel);

  const [savedToast, setSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showOnboardingConfirm, setShowOnboardingConfirm] = useState<null | { resetNickname: boolean }>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetAck, setResetAck] = useState(false);
  const [resetText, setResetText] = useState('');

  const recentResultLabel = useMemo(() => {
    if (!initial.hasRecentResult || !initial.recentResultAt) return '없음';
    const leftMs = initial.recentResultAt + QUIZ_RESULT_TTL_MS - Date.now();
    if (leftMs <= 0) return '만료 예정';
    const leftHours = Math.max(1, Math.floor(leftMs / (60 * 60 * 1000)));
    return `있음 (약 ${leftHours}시간 남음)`;
  }, [initial.hasRecentResult, initial.recentResultAt]);

  useEffect(() => {
    if (!savedToast) return;
    const t = window.setTimeout(() => setSavedToast(false), 1400);
    return () => window.clearTimeout(t);
  }, [savedToast]);

  useEffect(() => {
    if (showResetConfirm) return;
    setResetAck(false);
    setResetText('');
  }, [showResetConfirm]);

  function save() {
    setError(null);
    const trimmed = nickname.trim();

    if (trimmed.length > 12) {
      setError('닉네임이 조금 길어. 12글자 안으로 줄여볼까?');
      return;
    }

    const st = loadState();
    const next = {
      ...st,
      settings: {
        ...st.settings,
        nickname: trimmed,
        dailyCount,
        lastGradeLabel: lastGrade,
      },
    };

    saveState(next);
    setSavedToast(true);
  }

  function startOnboardingAgain(opts: { resetNickname: boolean }) {
    const st = loadState();
    const nextSettings = {
      ...st.settings,
      onboardingCompleted: false,
      onboardingCompletedAt: undefined,
      onboardingSkipped: undefined,
      nickname: opts.resetNickname ? '' : st.settings.nickname,
    };

    saveState({ ...st, settings: nextSettings });
    router.push('/onboarding');
  }

  function resetAll() {
    // Wipe all app-related local/session keys and restore default state.
    clearAllLocalState();
    router.push('/');
  }

  const canResetAll = resetAck && resetText.trim().toUpperCase() === 'RESET';

  const { mode: themeMode, setTheme } = useTheme();
  const THEME_OPTIONS: { value: ThemeMode; label: string; emoji: string }[] = [
    { value: 'system', label: '자동', emoji: '🖥️' },
    { value: 'light', label: '밝게', emoji: '☀️' },
    { value: 'dark', label: '어둡게', emoji: '🌙' },
  ];

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-3">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">설정</h1>
          <Dino className="text-2xl" />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            닉네임·목표·시작 급수를 바꿀 수 있어.
          </div>
          <Link href="/" className="text-xs font-extrabold underline" style={{ color: 'var(--muted)' }}>
            홈
          </Link>
        </div>
      </header>

      <Card className="mb-3 p-4">
        <div className="text-sm font-extrabold">저장 상태 요약</div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <div className="rounded-xl bg-white/70 px-3 py-2">학습 기록 수: <span className="font-extrabold" style={{ color: 'var(--fg)' }}>{initial.progressCount}개</span></div>
          <div className="rounded-xl bg-white/70 px-3 py-2">최근 학습일: <span className="font-extrabold" style={{ color: 'var(--fg)' }}>{initial.lastStudyDate || '없음'}</span></div>
          <div className="rounded-xl bg-white/70 px-3 py-2">최근 퀴즈 결과 캐시: <span className="font-extrabold" style={{ color: 'var(--fg)' }}>{recentResultLabel}</span></div>
        </div>
        {initial.isLegacyNoDaily && (
          <div className="mt-2 text-xs">
            <Link className="font-extrabold underline" href="/progress?legacy=1" style={{ color: 'var(--muted)' }}>
              레거시 진도 안내 다시 보기
            </Link>
          </div>
        )}
      </Card>

      {error && (
        <Card className="mb-3 p-3" style={{ borderColor: 'rgba(220,38,38,0.25)' }}>
          <div className="text-sm font-extrabold" style={{ color: 'rgb(185,28,28)' }}>
            {error}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="text-sm font-extrabold">기본 설정</div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          이 설정은 “오늘 미션”과 학습 시작 화면에 반영돼.
        </div>

        <div className="mt-4">
          <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
            닉네임
          </div>
          <input
            className="focus-ring mt-2 w-full rounded-2xl border-2 px-3 py-3 text-base font-extrabold"
            style={{ borderColor: 'rgba(2,132,199,0.18)', background: 'rgba(255,255,255,0.85)' }}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 공룡"
            inputMode="text"
            maxLength={20}
            aria-label="닉네임"
          />
        </div>

        <div className="mt-4">
          <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
            하루 목표
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DAILY_CHOICES.map((n) => (
              <Button
                key={n}
                variant={dailyCount === n ? 'primary' : 'ghost'}
                className="w-full"
                data-testid={`settings-daily-${n}`}
                onClick={() => setDailyCount(n)}
              >
                {n}자
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
            시작 급수(최근 급수)
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {GRADE_CHOICES.map((g) => (
              <Button key={g} variant={lastGrade === g ? 'primary' : 'ghost'} className="w-full" onClick={() => setLastGrade(g)}>
                {g}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            {savedToast ? '저장했어!' : ' '}
          </div>
          <Button onClick={save} data-testid="settings-save">저장</Button>
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <div className="text-sm font-extrabold">화면 테마</div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          밝은 화면이 좋을 때, 어두운 화면이 좋을 때 바꿀 수 있어.
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((t) => (
            <Button
              key={t.value}
              variant={themeMode === t.value ? 'primary' : 'ghost'}
              className="w-full"
              data-testid={`settings-theme-${t.value}`}
              onClick={() => setTheme(t.value)}
            >
              {t.emoji} {t.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="mt-3 p-4">
        <div className="text-sm font-extrabold">다시 시작</div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          온보딩을 다시 하거나, 모든 학습 기록을 초기화할 수 있어.
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowOnboardingConfirm({ resetNickname: false })}
            leftIcon={<span aria-hidden>🧭</span>}
          >
            온보딩 다시하기{initial.onboardingCompleted ? '' : ' (아직 완료 전)'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowOnboardingConfirm({ resetNickname: true })}
            leftIcon={<span aria-hidden>🧼</span>}
          >
            온보딩 다시하기 (닉네임 비우기)
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            leftIcon={<span aria-hidden>🗑️</span>}
            data-testid="settings-reset-open"
          >
            학습 기록 전체 초기화
          </Button>
        </div>
      </Card>

      {/* Onboarding confirm */}
      {showOnboardingConfirm && (
        <Modal open={true} title="온보딩을 다시 할까?" onClose={() => setShowOnboardingConfirm(null)}>
          <div>
            {showOnboardingConfirm.resetNickname
              ? '온보딩 완료 표시를 지우고, 닉네임도 비운 뒤 온보딩 화면으로 이동해.'
              : '온보딩 완료 표시를 지우고 온보딩 화면으로 이동해. (닉네임은 유지)'}
          </div>
          <div className="mt-4 flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowOnboardingConfirm(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                const opts = showOnboardingConfirm;
                setShowOnboardingConfirm(null);
                startOnboardingAgain(opts);
              }}
            >
              이동
            </Button>
          </div>
        </Modal>
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <Modal open={true} title="정말 초기화할까?" onClose={() => setShowResetConfirm(false)}>
          <div className="space-y-3 text-sm">
            <p>
              아래 데이터가 전부 삭제돼: 학습 진행(정답/오답/복습 일정), 스트릭, 퀴즈 통계, 최근 세션/이어하기, 화면 UI 저장값.
            </p>
            <p style={{ color: 'var(--muted)' }}>
              한자 데이터 파일/PWA 설치 상태는 그대로 남아. 이 작업은 되돌릴 수 없어.
            </p>

            <label className="flex items-start gap-2 rounded-2xl border-2 p-3" style={{ borderColor: 'rgba(2,132,199,0.16)' }}>
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={resetAck}
                onChange={(e) => setResetAck(e.target.checked)}
                aria-label="초기화 복구 불가 동의"
                data-testid="settings-reset-ack"
              />
              <span className="text-xs">삭제 후 복구할 수 없다는 걸 이해했어.</span>
            </label>

            <div>
              <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
                확인을 위해 <span className="font-black">RESET</span> 을 입력해줘
              </div>
              <input
                className="focus-ring mt-2 w-full rounded-2xl border-2 px-3 py-3 text-sm font-extrabold"
                style={{ borderColor: 'rgba(2,132,199,0.18)', background: 'rgba(255,255,255,0.85)' }}
                value={resetText}
                onChange={(e) => setResetText(e.target.value)}
                placeholder="RESET"
                autoCapitalize="characters"
                spellCheck={false}
                aria-label="초기화 확인 입력"
                data-testid="settings-reset-input"
              />
            </div>
          </div>

          <div className="mt-4 flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
              취소
            </Button>
            <Button
              disabled={!canResetAll}
              data-testid="settings-reset-confirm"
              onClick={() => {
                setShowResetConfirm(false);
                resetAll();
              }}
            >
              초기화 실행
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
