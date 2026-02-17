'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { StateCard } from '@/components/ui/StateCard';
import { ALL_KANJI, kanjiByGradeLabel, todayKey } from '@/lib/kanji';
import { pickOne } from '@/lib/copy';
import { calcQuizXp, loadQuizResult, QUIZ_RETRY_KEY, type QuizResultPayload } from '@/lib/quizResult';
import { loadState } from '@/lib/storage';
import { logEvent } from '@/lib/telemetry';
import type { GradeLabel, KanjiItem } from '@/lib/types';

function pct(n: number) {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.max(0, Math.min(100, Math.round(n)))}%`;
}

export default function ResultClient() {
  const sp = useSearchParams();
  const grade = (sp.get('grade') || '8급') as GradeLabel;
  const quizId = sp.get('quizId') || 'session';

  const [payload, setPayload] = useState<QuizResultPayload | null>(null);
  const [selectedWrongId, setSelectedWrongId] = useState<string | null>(null);

  useEffect(() => {
    const parsed = loadQuizResult();
    if (!parsed) return;
    setPayload(parsed);

    // default: open the first wrong item so "1 tap" reveals explanation
    if (parsed.wrongKanjiIds?.length) setSelectedWrongId(parsed.wrongKanjiIds[0] || null);
  }, []);

  const total = payload?.total ?? 0;
  const score = payload?.score ?? 0;
  const accuracy = total ? (score / total) * 100 : 0;
  const xp = payload?.xp ?? calcQuizXp(score, total);

  const wrongItems = useMemo(() => {
    const ids = payload?.wrongKanjiIds || [];
    const map = new Map(ALL_KANJI.map((k) => [k.id, k] as const));
    return ids.map((id) => map.get(id)).filter((x): x is KanjiItem => !!x);
  }, [payload]);

  const selectedItem = useMemo(() => {
    if (!selectedWrongId) return null;
    return ALL_KANJI.find((k) => k.id === selectedWrongId) || null;
  }, [selectedWrongId]);

  const st = useMemo(() => loadState(), []);
  const streakCount = st.streak.count;
  const quizAnswered = st.stats?.quizAnswered || 0;

  const nextBadgeHint = useMemo(() => {
    if (streakCount < 3) return `다음 뱃지: ⭐ 연속 3일 (${streakCount}/3)`;
    if (streakCount < 7) return `다음 뱃지: 🌈 연속 7일 (${streakCount}/7)`;
    if (quizAnswered < 50) return `다음 뱃지: 🏅 퀴즈 50문제 (${quizAnswered}/50)`;
    return '모든 뱃지를 모았어! 🎉';
  }, [streakCount, quizAnswered]);

  const dueCountInGrade = useMemo(() => {
    const now = Date.now();
    return kanjiByGradeLabel(grade).filter((k) => {
      const p = st.progress[k.id];
      return p && !p.mastered && p.nextReviewAt <= now;
    }).length;
  }, [grade, st]);

  const finishMsg = useMemo(() => {
    // 성과 기반 감정 피드백 (잘한 점 1개 + 격려)
    if (accuracy >= 100) {
      return pickOne(
        ['완벽해! 🎯 한 문제도 안 틀렸어!', '만점이야! 🌟 오늘 정말 대단해!', '전부 맞혔어! 🏆 최고야!'],
        `${todayKey()}|quiz|${grade}|${score}|${total}`
      );
    }
    if (accuracy >= 80) {
      return pickOne(
        ['거의 다 맞았어! 조금만 더 하면 만점이야 💪', '실력이 쑥쑥 올라가고 있어! ⭐', '대단해! 오답만 복습하면 완벽해질 거야 🔥'],
        `${todayKey()}|quiz|${grade}|${score}|${total}`
      );
    }
    if (accuracy >= 50) {
      return pickOne(
        ['절반 이상 맞았어! 계속 하면 분명 늘어 📈', '좋은 시작이야! 오답 노트를 보면 도움이 돼 👀', '잘 하고 있어! 복습하면 더 잘할 수 있어 💡'],
        `${todayKey()}|quiz|${grade}|${score}|${total}`
      );
    }
    return pickOne(
      ['괜찮아! 한자는 반복이 실력이야 🔄', '틀려도 괜찮아. 다시 풀면 기억에 남아! 🧠', '처음엔 다 어려워. 계속 하면 반드시 늘어! 🌱'],
      `${todayKey()}|quiz|${grade}|${score}|${total}`
    );
  }, [grade, score, total, accuracy]);

  const previousComparison = useMemo(() => {
    // 직전 일별 통계와 비교
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const yesterday = st.stats?.daily?.[yKey];
    if (!yesterday || !yesterday.answered) return null;
    const yAcc = Math.round((yesterday.correct / yesterday.answered) * 100);
    const diff = Math.round(accuracy) - yAcc;
    if (diff > 0) return `어제보다 정답률 ${diff}%p 올랐어! 📈`;
    if (diff === 0) return '어제랑 같은 실력을 유지하고 있어! 🏃';
    return null; // 떨어졌으면 안 보여줌 (기분 보호)
  }, [st, accuracy]);

  const hasWrong = wrongItems.length > 0;
  const reviewCount = Math.min(10, dueCountInGrade);
  const primaryHref = hasWrong
    ? `/quiz/${encodeURIComponent(quizId)}?grade=${encodeURIComponent(grade)}&retry=1`
    : `/study?grade=${encodeURIComponent(grade)}&n=${10}&review=1`;
  const primaryLabel = hasWrong ? '오답 다시풀기' : `복습 ${reviewCount}개 더 하기`;

  if (!payload) {
    return (
      <main className="mx-auto min-h-[100svh] max-w-md p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-center justify-between">
          <Link className="text-sm text-blue-700 underline" href="/">
            ← 홈
          </Link>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            결과
          </div>
        </div>

        <StateCard
          icon="🧭"
          title="결과를 찾을 수 없어"
          description="퀴즈 결과는 최대 24시간 저장돼. 이후에는 자동으로 지워질 수 있어."
          hint="팁: 퀴즈가 끝나면 바로 ‘홈’이나 ‘진도’로 이동해도 돼."
          actions={[
            {
              label: '퀴즈 다시 시작',
              href: `/quiz/session?grade=${encodeURIComponent(grade)}`,
              variant: 'primary',
              testId: 'quiz-result-missing-start',
              onClick: () => logEvent('quiz_result_missing_start_quiz_click', { grade }),
            },
            {
              label: '홈으로 가기',
              href: '/',
              variant: 'ghost',
              testId: 'quiz-result-missing-home',
              onClick: () => logEvent('quiz_result_missing_home_click', { grade }),
            },
            {
              label: '진도 보기',
              href: '/progress',
              variant: 'ghost',
              testId: 'quiz-result-missing-progress',
            },
          ]}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100svh] max-w-md p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between">
        <Link className="text-sm text-blue-700 underline" href="/">
          ← 홈
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          결과
        </div>
      </div>

      <Card className="p-5 text-center">
        <div className="text-4xl">🏁</div>
        <h1 className="mt-2 text-2xl font-extrabold">퀴즈 완료!</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {finishMsg}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-left">
          <div className="rounded-2xl bg-white/70 px-3 py-3">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
              점수
            </div>
            <div className="mt-1 text-lg font-extrabold">
              {score}
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {' '}/ {total}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/70 px-3 py-3">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
              정답률
            </div>
            <div className="mt-1 text-lg font-extrabold">{pct(accuracy)}</div>
          </div>
          <div className="rounded-2xl bg-white/70 px-3 py-3">
            <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
              획득 XP
            </div>
            <div className="mt-1 text-lg font-extrabold">+{xp}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-left text-sm">
          <div className="font-extrabold">오늘의 성과</div>
          <div className="mt-1" style={{ color: 'var(--muted)' }}>
            🔥 연속 {streakCount}일
          </div>
          <div className="mt-1" style={{ color: 'var(--muted)' }}>
            {nextBadgeHint}
          </div>
          {previousComparison && (
            <div className="mt-1 font-extrabold" style={{ color: 'var(--primary)' }}>
              {previousComparison}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center"
            href={`/study?grade=${encodeURIComponent(grade)}&n=${10}`}
            data-testid="quiz-result-next-mission"
            onClick={() => logEvent('quiz_next_mission_click', { grade })}
          >
            다음 미션 가기
          </Link>
          <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/">
            홈으로
          </Link>
        </div>
      </Card>

      {hasWrong ? (
        <div className="mt-4">
          <div className="mb-2 text-sm font-extrabold">오답 노트</div>

          <div className="grid grid-cols-1 gap-2">
            {wrongItems.map((k) => {
              const active = selectedWrongId === k.id;
              return (
                <button
                  key={k.id}
                  className={`focus-ring w-full rounded-2xl border-2 px-4 py-4 text-left transition-colors ${
                    active ? 'border-blue-600 bg-blue-50' : 'bg-white/70'
                  }`}
                  style={{ borderColor: active ? 'rgba(37,99,235,0.45)' : 'rgba(2,132,199,0.16)' }}
                  onClick={() => {
                    setSelectedWrongId(k.id);
                    logEvent('quiz_wrong_tap', { grade, kanjiId: k.id });
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-extrabold">{k.hanja}</div>
                      <div className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                        {k.meaning} · {k.reading}
                      </div>
                    </div>
                    <div className="text-lg" aria-hidden>
                      {active ? '👀' : '👉'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Card className="mt-3 p-4">
            {selectedItem ? (
              <div>
                <div className="text-sm font-extrabold">정답 & 해설</div>
                <div className="mt-2 text-xl font-extrabold">
                  {selectedItem.hanja}{' '}
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    = {selectedItem.meaning} {selectedItem.reading}
                  </span>
                </div>

                {selectedItem.exampleWord ? (
                  <div className="mt-2 rounded-2xl bg-white/70 px-3 py-3 text-sm">
                    <div className="text-xs font-extrabold" style={{ color: 'var(--muted)' }}>
                      예문
                    </div>
                    <div className="mt-1">
                      <span className="font-extrabold">{selectedItem.exampleWord}</span>
                      {selectedItem.exampleMeaning ? ` · ${selectedItem.exampleMeaning}` : ''}
                    </div>
                  </div>
                ) : null}

                {selectedItem.confusables?.length ? (
                  <div className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                    헷갈리기:{' '}
                    <span className="font-extrabold">{selectedItem.confusables.slice(0, 6).join(' ')}</span>
                  </div>
                ) : null}

                <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                  탭하면 바로 해설이 보여. 다시 풀면 더 단단해져!
                </div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                오답을 탭하면 정답/해설이 바로 나와.
              </div>
            )}
          </Card>
        </div>
      ) : null}

      <div className="mt-4">
        <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/progress">
          진도 보기
        </Link>
      </div>

      <div className="mt-2 text-center text-xs" style={{ color: 'var(--muted)' }}>
        정답/오답은 자동으로 복습 일정에 반영돼.
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t" style={{ background: 'rgba(240,249,255,0.94)', borderColor: 'rgba(2,132,199,0.12)' }}>
        <div className="mx-auto w-full max-w-md p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link
            className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
            href={primaryHref}
            data-testid="quiz-result-primary-cta"
            onClick={() => {
              if (hasWrong) {
                logEvent('quiz_retry_click', { grade, wrong: wrongItems.length });
                window.sessionStorage.setItem(QUIZ_RETRY_KEY, JSON.stringify(wrongItems.map((w) => w.id)));
                return;
              }
              logEvent('post_done_more_review_click', { grade, due: dueCountInGrade });
            }}
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
