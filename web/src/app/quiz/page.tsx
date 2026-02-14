import { Suspense } from 'react';
import QuizClient from './QuizClient';

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-4 text-sm text-gray-600">퀴즈 로딩중…</div>}>
      <QuizClient />
    </Suspense>
  );
}
