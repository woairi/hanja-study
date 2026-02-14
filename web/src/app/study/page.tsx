import { Suspense } from 'react';
import StudyClient from './StudyClient';

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-4 text-sm text-gray-600">학습 로딩중…</div>}>
      <StudyClient />
    </Suspense>
  );
}
