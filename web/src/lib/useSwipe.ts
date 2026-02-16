'use client';

import { useRef, useCallback } from 'react';

type SwipeDir = 'left' | 'right';

/**
 * 학습 카드 스와이프 훅
 * — 좌/우 스와이프 감지 (최소 50px, 수평이 수직보다 클 때)
 */
export function useSwipe(onSwipe: (dir: SwipeDir) => void) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // 최소 50px 수평 이동 + 수평이 수직보다 커야 함
      if (absDx > 50 && absDx > absDy * 1.5) {
        onSwipe(dx > 0 ? 'right' : 'left');
      }
    },
    [onSwipe]
  );

  return { onTouchStart, onTouchEnd };
}
