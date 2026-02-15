import { Suspense } from 'react';
import ResultClient from './ResultClient';

export default function QuizResultPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto min-h-[100svh] max-w-md p-4 text-center">결과 불러오는 중…</main>}
    >
      <ResultClient />
    </Suspense>
  );
}
