'use client';

import Link from 'next/link';
import { Card } from './Card';
import { Button } from './Button';

export type StateCardAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  testId?: string;
};

type StateCardProps = {
  icon?: string;
  title: string;
  description?: string;
  hint?: string;
  actions?: StateCardAction[];
  className?: string;
};

export function StateCard({ icon, title, description, hint, actions = [], className }: StateCardProps) {
  return (
    <Card className={`p-4 text-center ${className ?? ''}`.trim()}>
      {icon ? <div className="text-4xl">{icon}</div> : null}
      <h2 className="mt-2 text-lg font-extrabold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
          {description}
        </p>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {actions.map((a, idx) => {
            const variant = a.variant ?? 'ghost';
            if (a.href) {
              return (
                <Link
                  key={`${a.label}-${idx}`}
                  className={`btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} focus-ring inline-flex w-full items-center justify-center`}
                  href={a.href}
                  onClick={a.onClick}
                  data-testid={a.testId}
                >
                  {a.label}
                </Link>
              );
            }

            return (
              <Button key={`${a.label}-${idx}`} variant={variant} className="w-full" onClick={a.onClick} data-testid={a.testId}>
                {a.label}
              </Button>
            );
          })}
        </div>
      ) : null}

      {hint ? (
        <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          {hint}
        </div>
      ) : null}
    </Card>
  );
}
