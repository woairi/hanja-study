'use client';

import { Suspense } from 'react';
import ExamResultContent from './ExamResultContent';

export default function ExamResultPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-md p-4 text-center">
        <div style={{ color: 'var(--muted)' }}>결과 불러오는 중...</div>
      </main>
    }>
      <ExamResultContent />
    </Suspense>
  );
}
