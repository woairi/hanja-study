'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-2 z-50 mx-auto max-w-md px-4">
      <div className="card flex items-center justify-between gap-3 px-4 py-3 text-sm font-extrabold">
        <span>📴 오프라인이에요. 학습은 되지만 새로고침은 조심!</span>
      </div>
    </div>
  );
}
