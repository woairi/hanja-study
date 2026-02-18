"use client";

// Note: metadata export requires server component, but this page is cached
// by SW at build time so SEO is irrelevant. Title set via <title> directly.

export default function OfflinePage() {
  return (
    <>
      <title>오프라인 | 한자 공부</title>
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        {/* 공룡 마스코트 */}
        <span className="text-7xl mb-4" role="img" aria-label="공룡">
          🦕
        </span>

        <h1 className="text-2xl font-bold text-sky-700 dark:text-sky-300 mb-2">
          인터넷이 끊겼어요!
        </h1>

        <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
          걱정 마세요. 인터넷이 다시 연결되면
          <br />
          자동으로 돌아올 수 있어요 🌐
        </p>

        <button
          type="button"
          onClick={() => location.reload()}
          className="rounded-xl bg-sky-500 px-6 py-3 text-lg font-semibold text-white shadow-md active:scale-95 transition-transform"
        >
          다시 시도하기 🔄
        </button>

        <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
          이미 본 페이지는 오프라인에서도 볼 수 있어요!
        </p>
      </main>
    </>
  );
}
