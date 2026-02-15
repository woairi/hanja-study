# QE 노트 (QA 체크리스트)

## RC 체크 기록

### 2026-02-15 (RC 회귀/배포 게이트)
- 자동화 게이트: **PASS**
  - `cd web && npm test` ✅
  - `cd web && npm run lint` ✅
  - `cd web && npm run build` ✅
  - `cd web && npm run check:data` ✅
  - `cd web && npm run predeploy` ✅ (lint/test/data/build 모두 통과)
- 스모크(Home→Study→Quiz→Result): **전반 PASS**
  - 홈에서 목표(5/10/15) 변경 및 새로고침 후 유지 ✅
  - 홈 → 학습 진입 ✅
  - 학습 카드: 뜻/음 보기 토글 ✅
  - 학습 완료 후 “퀴즈 시작” 노출 ✅
  - 퀴즈: 문제/선지 렌더링, 선택 후 다음 이동 ✅
  - 퀴즈 종료 후 결과 화면 ✅
  - `/progress` 진도 요약/급수별 학습/복습 대기 표시 ✅
- 관찰된 리스크/이슈(후속 조치 권장)
  - (의심) `/study?grade=...&n=1`처럼 URL로 n을 낮춰도, 학습 완료 후 “퀴즈 시작” 링크가 **현재 목표 n(예: 10)** 으로 생성되는 것으로 보임.
    - 재현(로컬): 목표 10 설정 후 `/study?...&n=1` → 학습 완료 → `퀴즈 시작`이 `/quiz/session?...&n=10`.
    - 영향: 의도치 않게 퀴즈/복습 대기(due) 수가 늘어날 수 있음(예: due 9 생성). 
    - 상태: 설계 의도 여부 확인 필요(의도라면 문서에 명시, 아니라면 버그).

---

## 스모크 테스트
- [ ] `/`에서 급수 카드 6개(8,7,7Ⅱ,6,6Ⅱ,5) 표시
- [x] 오늘 목표(5/10/15) 변경 후 새로고침해도 유지
- [x] 급수 선택 → `/study` 이동
- [x] 학습 카드: 뜻/음 보기 토글 동작
- [x] n개 카드 완료 후 “퀴즈 시작” 버튼 노출
- [x] 퀴즈: 문제/선지 렌더링, 선택 후 다음 이동
- [x] 퀴즈 종료 후 결과 화면
- [x] `/progress` 진도 표시 (seen/mastered/due)

## 엣지 케이스
- [ ] localStorage가 깨졌을 때(비정상 JSON) 기본값으로 복구
- [ ] sessionStorage(학습 세션)가 없을 때 `/quiz` 진입 시 안전(로딩/홈 유도)
- [ ] n=15에서 모바일 스크롤/터치 실수 없이 진행 가능한지
- [ ] 함정문제 옵션 중복(동일 텍스트) 발생 여부

## 데이터 품질
- [ ] meaning/reading이 비어있는 레코드가 없는지(0개가 목표)
- [ ] gradeLabel별 개수(8=50,7=50,7Ⅱ=50,6=75,6Ⅱ=75,5=100)

## 배포 블로커 게이트 (P0)
아래 4개는 **배포 전 필수 통과**로 고정.

- [x] `cd web && npm run predeploy` (lint/test/data/build)
- [x] localStorage migration(legacy id → canonical id) 자동 테스트 통과
- [x] SRS interval/오답 리셋(특히 4급/4급Ⅱ 하드모드) 자동 테스트 통과
- [x] 함정문제(trap) 옵션 중복(동일 텍스트) 방지 자동 테스트 통과

### P0 자동화(유닛 테스트) 실행 커맨드
기본:
- `cd web && npm test`

개별 파일만:
- `cd web && npx jest src/lib/__tests__/storage.migration.test.ts`
- `cd web && npx jest src/lib/__tests__/srs.test.ts`
- `cd web && npx jest src/lib/__tests__/quiz.trap.test.ts`

참고:
- `next start`가 실행 중이면 `npm run build`가 `.next/lock` 때문에 실패할 수 있음 → 실행 중인 서버 종료 후 재시도

## 비기능
- [ ] Lighthouse 모바일 성능/접근성 기본 점검
- [ ] Vercel 배포 후 404/라우팅 정상
