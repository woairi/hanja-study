export default function AboutPage() {
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-bold">안내</h1>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
        <li>어문회 급수(8급~5급, 7급Ⅱ/6급Ⅱ 포함) 기준으로 학습합니다.</li>
        <li>학습 기록은 로그인 없이 이 기기(브라우저)에 저장됩니다.</li>
        <li>퀴즈의 20%는 비슷한 한자를 구분하는 함정문제입니다.</li>
      </ul>
      <p className="mt-4 text-sm text-gray-600">(MVP) 쓰기/획순은 추후 추가할 수 있어요.</p>
    </main>
  );
}
