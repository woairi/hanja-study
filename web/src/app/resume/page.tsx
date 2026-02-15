'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadLastSession } from '@/lib/session';

export default function ResumePage() {
  const router = useRouter();

  useEffect(() => {
    const s = loadLastSession();
    if (!s) {
      router.replace('/');
      return;
    }
    if (s.mode === 'study') {
      router.replace(`/study?grade=${encodeURIComponent(s.gradeLabel)}&n=${s.n}&resume=1`);
    } else {
      router.replace(`/quiz/session?grade=${encodeURIComponent(s.gradeLabel)}&n=${s.n}&resume=1`);
    }
  }, [router]);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="text-sm" style={{ color: 'var(--muted)' }}>
        이어하는 중…
      </div>
    </main>
  );
}
