'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

type MatchPair = { left: string; right: string };

type Props = {
  pairs: MatchPair[];
  onComplete: (allCorrect: boolean) => void;
};

/**
 * 짝짓기 UI — tap-tap 방식
 * 왼쪽(한자) 선택 → 오른쪽(뜻) 선택 → 매칭 판정
 */
export default function MatchingQuestion({ pairs, onComplete }: Props) {
  const [leftOrder] = useState(() => shuffle(pairs.map((_, i) => i)));
  const [rightOrder] = useState(() => shuffle(pairs.map((_, i) => i)));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(null);

  const handleLeftTap = useCallback((idx: number) => {
    if (matched.has(idx)) return;
    setSelectedLeft(idx);
    setWrong(null);
  }, [matched]);

  const handleRightTap = useCallback((idx: number) => {
    if (selectedLeft === null || matched.has(idx)) return;

    if (selectedLeft === idx) {
      // 정답!
      setMatched((prev) => new Set([...prev, idx]));
      setSelectedLeft(null);
      setWrong(null);
    } else {
      // 오답
      setWrong({ left: selectedLeft, right: idx });
      setTimeout(() => {
        setWrong(null);
        setSelectedLeft(null);
      }, 600);
    }
  }, [selectedLeft, matched]);

  // 전부 매칭 완료 시
  useEffect(() => {
    if (matched.size === pairs.length && pairs.length > 0) {
      const timer = setTimeout(() => onComplete(true), 400);
      return () => clearTimeout(timer);
    }
  }, [matched, pairs.length, onComplete]);

  return (
    <div className="flex gap-3">
      {/* 왼쪽: 한자 */}
      <div className="flex flex-1 flex-col gap-2">
        {leftOrder.map((idx) => {
          const isMatched = matched.has(idx);
          const isSelected = selectedLeft === idx;
          const isWrong = wrong?.left === idx;

          return (
            <button
              key={`l-${idx}`}
              className="focus-ring rounded-2xl border-2 px-3 py-4 text-center text-2xl font-extrabold transition-all"
              style={{
                background: isMatched
                  ? 'rgba(34,197,94,0.15)'
                  : isWrong
                    ? 'rgba(239,68,68,0.12)'
                    : isSelected
                      ? 'rgba(2,132,199,0.12)'
                      : 'rgba(255,255,255,0.8)',
                borderColor: isMatched
                  ? 'rgba(34,197,94,0.5)'
                  : isWrong
                    ? 'rgba(239,68,68,0.5)'
                    : isSelected
                      ? 'var(--primary)'
                      : 'rgba(2,132,199,0.16)',
                opacity: isMatched ? 0.5 : 1,
              }}
              disabled={isMatched}
              onClick={() => handleLeftTap(idx)}
            >
              {pairs[idx].left}
            </button>
          );
        })}
      </div>

      {/* 오른쪽: 뜻 */}
      <div className="flex flex-1 flex-col gap-2">
        {rightOrder.map((idx) => {
          const isMatched = matched.has(idx);
          const isWrong = wrong?.right === idx;

          return (
            <button
              key={`r-${idx}`}
              className="focus-ring rounded-2xl border-2 px-3 py-4 text-center text-sm font-extrabold transition-all"
              style={{
                background: isMatched
                  ? 'rgba(34,197,94,0.15)'
                  : isWrong
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(255,255,255,0.8)',
                borderColor: isMatched
                  ? 'rgba(34,197,94,0.5)'
                  : isWrong
                    ? 'rgba(239,68,68,0.5)'
                    : 'rgba(2,132,199,0.16)',
                opacity: isMatched ? 0.5 : 1,
              }}
              disabled={isMatched}
              onClick={() => handleRightTap(idx)}
            >
              {pairs[idx].right}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
