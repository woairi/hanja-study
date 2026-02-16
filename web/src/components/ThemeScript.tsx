/**
 * 페이지 로드 시 저장된 테마를 즉시 적용 (FOUC 방지)
 * — <head>에 인라인 스크립트로 삽입
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var t = localStorage.getItem('hanja-study:theme');
        if (t === 'dark' || t === 'light') {
          document.documentElement.setAttribute('data-theme', t);
        }
      } catch(e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
