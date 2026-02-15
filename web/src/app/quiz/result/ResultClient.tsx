'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
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
    return pickOne(
      ['오늘도 한 단계 업!', '이제 기억이 더 단단해졌어.', '좋아! 내일은 더 쉬워질 거야.'],
      `${todayKey()}|quiz|${grade}|${score}|${total}`
    );
  }, [grade, score, total]);

  const hasWrong = wrongItems.length > 0;

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

        <Card className="p-5 text-center">
          <div className="text-4xl">🧭</div>
          <h1 className="mt-2 text-xl font-extrabold">결과를 찾을 수 없어</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            퀴즈 결과는 최대 24시간 저장돼. 이후에는 자동으로 지워질 수 있어.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <Link
              className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
              href={`/quiz/session?grade=${encodeURIComponent(grade)}`}
              onClick={() => logEvent('quiz_result_missing_start_quiz_click', { grade })}
            >
              퀴즈 다시 시작
            </Link>
            <Link
              className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center"
              href="/"
              onClick={() => logEvent('quiz_result_missing_home_click', { grade })}
            >
              홈으로 가기
            </Link>
          </div>

          <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            팁: 퀴즈가 끝나면 바로 “홈”이나 “진도”로 이동해도 돼.
          </div>
        </Card>

        <div className="mt-4">
          <Link className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center" href="/progress">
            진도 보기
          </Link>
        </div>
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
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {hasWrong ? (
            <Link
              className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
              href={`/quiz/${encodeURIComponent(quizId)}?grade=${encodeURIComponent(grade)}&retry=1`}
              onClick={() => {
                logEvent('quiz_retry_click', { grade, wrong: wrongItems.length });
                window.sessionStorage.setItem(QUIZ_RETRY_KEY, JSON.stringify(wrongItems.map((w) => w.id)));
              }}
            >
              오답 다시풀기
            </Link>
          ) : (
            <Link
              className="btn btn-primary focus-ring inline-flex w-full items-center justify-center"
              href={`/study?grade=${encodeURIComponent(grade)}&n=${10}&review=1`}
              onClick={() => logEvent('post_done_more_review_click', { grade, due: dueCountInGrade })}
            >
              복습 {Math.min(10, dueCountInGrade)}개 더 하기
            </Link>
          )}

          <Link
            className="btn btn-ghost focus-ring inline-flex w-full items-center justify-center"
            href={`/study?grade=${encodeURIComponent(grade)}&n=${10}`}
            onClick={() => logEvent('quiz_next_mission_click', { grade })}
          >
            다음 미션 가기
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
    </main>
  );
}
