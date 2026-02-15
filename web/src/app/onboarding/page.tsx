'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Dino from '@/components/Dino';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { loadState, saveState } from '@/lib/storage';
import type { GradeLabel } from '@/lib/types';

type Step = 1 | 2 | 3 | 4;

const GRADE_CHOICES: GradeLabel[] = ['8급', '7급', '7급Ⅱ', '6급', '6급Ⅱ', '5급', '4급', '4급Ⅱ'];

export default function OnboardingPage() {
  const router = useRouter();

  const initial = useMemo(() => {
    const st = loadState();
    return {
      nickname: st.settings.nickname || '',
      dailyCount: st.settings.dailyCount,
      lastGradeLabel: (st.settings.lastGradeLabel as GradeLabel) || '8급',
    };
  }, []);

  const [step, setStep] = useState<Step>(1);
  const [nickname, setNickname] = useState(initial.nickname);
  const [dailyCount, setDailyCount] = useState<5 | 10 | 15>(initial.dailyCount);
  const [diagChoice, setDiagChoice] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeLabel>(initial.lastGradeLabel);

  const [error, setError] = useState<string | null>(null);

  const diag = {
    prompt: '이 한자 뜻을 맞혀볼래?',
    hanja: '感',
    options: ['느낄', '노래', '입'],
    correct: '느낄',
    recommendedIfCorrect: '6급' as GradeLabel,
    recommendedIfWrong: '8급' as GradeLabel,
  };

  function goNext(nextStep: Step) {
    setError(null);
    setStep(nextStep);
  }

  function skip() {
    setError(null);
    if (step === 1) return goNext(2);
    if (step === 2) return goNext(3);
    if (step === 3) {
      // keep current grade
      return goNext(4);
    }
    // step 4: finish
    return finish({ skipped: true });
  }

  function finish(opts?: { skipped?: boolean }) {
    const st = loadState();
    const trimmed = nickname.trim();

    // If user typed something, gently validate minimal.
    if (trimmed.length > 0 && trimmed.length > 12) {
      setError('이름이 조금 길어. 12글자 안으로 줄여볼까?');
      setStep(1);
      return;
    }

    const next = {
      ...st,
      settings: {
        ...st.settings,
        nickname: trimmed.length ? trimmed : st.settings.nickname,
        dailyCount,
        lastGradeLabel: grade,
        onboardingCompleted: true,
        onboardingCompletedAt: Date.now(),
        onboardingSkipped: !!opts?.skipped,
      },
    };

    saveState(next);
    router.push('/');
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-3">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">처음 만났어!</h1>
          <Dino className="text-2xl" />
        </div>
        <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          3~4개의 짧은 질문만 답하면, 오늘 미션이 딱 맞게 준비돼.
        </div>
      </header>

      {error && (
        <Card className="mb-3 p-3" style={{ borderColor: 'rgba(220,38,38,0.25)' }}>
          <div className="text-sm font-extrabold" style={{ color: 'rgb(185,28,28)' }}>
            {error}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            괜찮아! 다시 한 번만 해보자.
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-4">
          <div className="text-sm font-extrabold" style={{ color: 'var(--muted)' }}>
            1/4
          </div>
          <div className="mt-2 text-lg font-extrabold">닉네임이 뭐야?</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            아무거나 좋아. 예: 공룡, 민지, 슈퍼한자맨
          </div>

          <input
            className="focus-ring mt-3 w-full rounded-2xl border-2 px-3 py-3 text-base font-extrabold"
            style={{ borderColor: 'rgba(2,132,199,0.18)', background: 'rgba(255,255,255,0.85)' }}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="여기에 적어줘"
            inputMode="text"
            maxLength={20}
            aria-label="닉네임"
          />

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={skip}>
              건너뛰기
            </Button>
            <Button
              onClick={() => {
                const trimmed = nickname.trim();
                if (trimmed.length === 0) {
                  // allow empty, but nudge if user tried and cleared
                  goNext(2);
                  return;
                }
                if (trimmed.length < 1) {
                  setError('이름을 한 글자만 적어도 좋아!');
                  return;
                }
                goNext(2);
              }}
              rightIcon={<span aria-hidden>▶</span>}
            >
              다음
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-4">
          <div className="text-sm font-extrabold" style={{ color: 'var(--muted)' }}>
            2/4
          </div>
          <div className="mt-2 text-lg font-extrabold">하루에 몇 글자 할까?</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            너무 많아도 괜찮아. 나중에 언제든 바꿀 수 있어.
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[5, 10, 15].map((n) => (
              <Button
                key={n}
                variant={dailyCount === n ? 'primary' : 'ghost'}
                className="w-full"
                onClick={() => setDailyCount(n as 5 | 10 | 15)}
              >
                {n}자
              </Button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={skip}>
              건너뛰기
            </Button>
            <Button onClick={() => goNext(3)} rightIcon={<span aria-hidden>▶</span>}>
              다음
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-4">
          <div className="text-sm font-extrabold" style={{ color: 'var(--muted)' }}>
            3/4
          </div>
          <div className="mt-2 text-lg font-extrabold">{diag.prompt}</div>
          <div className="mt-3 flex items-center justify-center rounded-2xl border-2 py-6" style={{ borderColor: 'rgba(2,132,199,0.18)' }}>
            <div className="text-5xl font-extrabold">{diag.hanja}</div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {diag.options.map((opt) => (
              <Button
                key={opt}
                variant={diagChoice === opt ? 'primary' : 'ghost'}
                className="w-full"
                onClick={() => {
                  setDiagChoice(opt);
                  const recommended = opt === diag.correct ? diag.recommendedIfCorrect : diag.recommendedIfWrong;
                  setGrade(recommended);
                }}
              >
                {opt}
              </Button>
            ))}
          </div>

          <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            힌트: 몰라도 괜찮아! 찍어도 돼.
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={skip}>
              건너뛰기
            </Button>
            <Button
              onClick={() => {
                // allow skip by not selecting
                goNext(4);
              }}
              rightIcon={<span aria-hidden>▶</span>}
            >
              다음
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-4">
          <div className="text-sm font-extrabold" style={{ color: 'var(--muted)' }}>
            4/4
          </div>
          <div className="mt-2 text-lg font-extrabold">이 급수로 시작할까?</div>
          <div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            추천은 자동으로 골라줬어. 마음에 안 들면 바꿔도 돼.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {GRADE_CHOICES.map((g) => (
              <Button
                key={g}
                variant={grade === g ? 'primary' : 'ghost'}
                className="w-full"
                onClick={() => setGrade(g)}
              >
                {g}
              </Button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={skip}>
              나중에 할래
            </Button>
            <Button onClick={() => finish()} rightIcon={<span aria-hidden>▶</span>}>
              시작!
            </Button>
          </div>

          <div className="mt-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
            <Link className="text-blue-700 underline" href="/">
              홈으로 돌아가기
            </Link>
          </div>
        </Card>
      )}
    </main>
  );
}
