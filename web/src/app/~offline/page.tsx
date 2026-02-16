/**
 * 오프라인 폴백 페이지
 * — Service Worker가 네비게이션 요청을 캐시에서 찾지 못할 때 표시
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-6 text-center">
      <span className="mb-4 text-6xl">📴</span>
      <h1 className="mb-2 text-2xl font-extrabold text-sky-800">
        오프라인이에요
      </h1>
      <p className="mb-6 text-base text-sky-600">
        인터넷 연결이 없어서 이 페이지를 불러올 수 없어요.
        <br />
        연결되면 다시 시도해주세요!
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl bg-sky-500 px-6 py-3 text-lg font-bold text-white shadow-md active:bg-sky-600"
      >
        다시 시도
      </button>
    </div>
  );
}
