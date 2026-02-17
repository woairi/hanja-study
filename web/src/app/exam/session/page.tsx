'use client';

import { Suspense } from 'react';
import ExamSessionClient from './ExamSessionClient';

export default function ExamSessionPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-md p-4">
        <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
          문제 준비 중...
        </div>
      </main>
    }>
      <ExamSessionClient />
    </Suspense>
  );
}
