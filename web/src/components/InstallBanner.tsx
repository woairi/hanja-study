"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * PWA 설치 배너 — beforeinstallprompt 이벤트 기반
 *
 * - 브라우저가 설치 가능 판단 시 하단 배너 표시
 * - 이미 standalone이면 표시 안 함
 * - 닫기 누르면 7일간 숨김 (localStorage)
 * - iOS Safari: 수동 안내 ("공유 → 홈 화면에 추가")
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < DISMISS_DAYS * 86_400_000;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/(CriOS|FxiOS|OPiOS)/.test(ua);
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // Android / Chrome / Edge — beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari — manual guidance
    if (isIOSSafari()) {
      setShowIOS(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 safe-bottom animate-slide-up">
      <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-lg border border-sky-100 dark:border-gray-700">
        {/* 아이콘 */}
        <span className="text-4xl shrink-0">🦖</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            홈 화면에 추가하기
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {showIOS
              ? "공유 버튼 → \"홈 화면에 추가\"를 눌러요!"
              : "앱처럼 바로 열 수 있어요!"}
          </p>
        </div>

        {/* 설치 or 닫기 */}
        <div className="flex items-center gap-2 shrink-0">
          {!showIOS && (
            <button
              type="button"
              onClick={handleInstall}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
            >
              설치
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 active:scale-95 transition-transform"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
