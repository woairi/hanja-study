import { Suspense } from 'react';
import QuizClient from './QuizClient';
import { Card } from '@/components/ui/Card';

function QuizPageFallback() {
  return (
    <main className="mx-auto min-h-[100svh] max-w-md p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-16 rounded bg-white/50" aria-hidden />
        <div className="h-5 w-14 rounded bg-white/50" aria-hidden />
      </div>
      <div className="mb-3 h-2 w-full rounded-full bg-white/60" aria-hidden />
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-6 w-24 rounded-full bg-gray-200" />
          <div className="mt-3 h-7 w-3/4 rounded bg-gray-200" />
          <div className="mt-4 space-y-2">
            <div className="h-14 rounded-2xl bg-gray-200" />
            <div className="h-14 rounded-2xl bg-gray-200" />
            <div className="h-14 rounded-2xl bg-gray-200" />
            <div className="h-14 rounded-2xl bg-gray-200" />
          </div>
          <div className="mt-3 h-16 rounded-2xl bg-gray-100" />
        </div>
      </Card>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Card className="flex gap-2 p-3">
          <div className="h-10 flex-1 rounded-2xl bg-gray-100" aria-hidden />
          <div className="h-10 flex-1 rounded-2xl bg-gray-200" aria-hidden />
        </Card>
      </div>
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<QuizPageFallback />}>
      <QuizClient />
    </Suspense>
  );
}
