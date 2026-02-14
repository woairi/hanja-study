'use client';

import { useEffect } from 'react';

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="닫기"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="card relative w-full max-w-md p-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-extrabold">{title}</div>
          <button className="btn btn-ghost focus-ring px-3 py-2" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
