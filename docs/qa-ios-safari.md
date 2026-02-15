# iOS Safari QA Known Issues / Workarounds

hanja-study 실기기 QA 시 iOS Safari에서 자주 발생하는 항목을 빠르게 점검하기 위한 메모.

## 1) viewport / safe-area
- 증상: 하단 CTA가 홈 인디케이터에 가려짐, 주소창 show/hide 때 레이아웃 점프
- 점검
  - [ ] 하단 고정 CTA가 `env(safe-area-inset-bottom)` 반영되는지
  - [ ] 주소창 접힘/펼침 시 버튼 터치 영역이 유지되는지
- 대응
  - sticky/fixed 영역에 safe-area padding 유지
  - `100vh` 대신 `svh/dvh` 기반 높이 우선

## 2) input focus / 키보드
- 증상: 입력창 focus 시 화면 점프, 버튼 가림
- 점검
  - [ ] settings 입력(닉네임/RESET)에서 키보드가 올라와도 입력 필드와 확인 버튼 접근 가능
- 대응
  - 입력 폼 주변 여백 확보, 스크롤 가능한 레이아웃 유지

## 3) back-forward cache(BFCache)
- 증상: 뒤로가기 후 상태 꼬임(이전 선택/화면 잔상)
- 점검
  - [ ] 학습→퀴즈→결과 후 back/forward 반복 시 크래시/화이트스크린 없는지
  - [ ] 결과 화면 새로고침/직접 진입에서 가드가 정상 동작하는지

## 4) fixed/sticky + scroll
- 증상: 하단 고정 바가 스크롤 중 깜빡이거나 터치 이벤트 누락
- 점검
  - [ ] `/quiz/result` 하단 sticky primary CTA가 항상 눌리는지
  - [ ] `/quiz/[id]` 하단 컨트롤 바가 문제 선택 영역과 충돌하지 않는지

## RC 최소 합격선 (iOS Safari)
- [ ] 홈→학습→퀴즈→결과 핵심 플로우 통과
- [ ] 결과 화면 CTA/오답 다시풀기/다음 미션 동작
- [ ] settings 저장/초기화 2단 확인 동작
- [ ] `/progress` 레거시 안내(보이기/숨김/`?legacy=1`) 동작
