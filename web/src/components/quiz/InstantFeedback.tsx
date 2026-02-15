import type { ReactNode } from 'react';

export type InstantFeedbackTone = 'correct' | 'wrong';

export type InstantFeedbackProps = {
  tone: InstantFeedbackTone;
  /** Short primary line (kid-friendly). */
  title: string;
  /** Optional short tag line (e.g. hint used, streak). */
  meta?: string;
  /** Optional explanation/details below. Keep it compact. */
  children?: ReactNode;
  /** Decorative celebration (kept subtle + reduced-motion safe via CSS). */
  celebrate?: boolean;
  sparkleKey?: number;
  confettiKey?: number;
};

export function InstantFeedback({
  tone,
  title,
  meta,
  children,
  celebrate,
  sparkleKey,
  confettiKey,
}: InstantFeedbackProps) {
  const isCorrect = tone === 'correct';

  return (
    <div
      className={`rounded-2xl px-3 py-2 text-sm font-bold ${
        isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
      }`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 break-words">
          {title}
          {meta ? <span className="ml-2 text-xs font-extrabold">{meta}</span> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {celebrate && isCorrect ? (
            <>
              <div key={confettiKey} className="confetti text-lg" aria-hidden>
                🎉
              </div>
              <div key={sparkleKey} className="sparkle text-lg" aria-hidden>
                ✨
              </div>
            </>
          ) : null}
        </div>
      </div>

      {children ? (
        <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
