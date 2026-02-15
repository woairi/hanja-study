# QE Top5 E2E 시나리오 (v1)

목표: RC마다 깨지면 바로 체감되는 핵심 흐름 5개를 고정한다.

## 시나리오

1) **앱 진입 + 홈 핵심 CTA**
- 경로: `/`
- 기대: 첫 화면 렌더, `home-mission-cta` 노출/클릭 가능

2) **학습 진입 + 카드 진행**
- 경로: `/study?grade=8급&n=1`
- 기대: `study-reveal` 클릭 가능, `study-next`로 완료까지 진행 가능

3) **학습 완료 → 퀴즈 진입 파라미터 유지**
- 경로: 학습 완료 화면
- 기대: `study-quiz-start` 링크의 `n`이 학습 세션과 일치

4) **퀴즈 상호작용(힌트/확인)**
- 경로: `/quiz/session?...`
- 기대: `quiz-hint` 동작, 선택 후 `quiz-confirm` 동작

5) **결과 화면 다음 행동 CTA**
- 경로: `/quiz/result?...`
- 기대: `quiz-result-primary-cta` 항상 노출, `quiz-result-next-mission` 동작

## 가드/예외 시나리오 (권장)
- 퀴즈 세션 없음: `quiz-missing-start-study` / `quiz-missing-home`
- 결과 없음: `quiz-result-missing-start` / `quiz-result-missing-home`

## 셀렉터 운영 규칙
- 테스트 자동화는 가능한 한 `data-testid`를 우선 사용
- UI 텍스트 변경이 있어도 테스트가 깨지지 않게 셀렉터 안정성 유지
