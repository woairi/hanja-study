'use client';

import { useEffect } from 'react';

export default function Toast({
  text,
  onDone,
  ms = 1200,
}: {
  text: string;
  onDone: () => void;
  ms?: number;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(t);
  }, [onDone, ms]);

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 mx-auto max-w-md px-4">
      <div className="card mx-auto w-fit px-4 py-3 text-sm font-extrabold">{text}</div>
    </div>
  );
}
