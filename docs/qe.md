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
- 관찰된 리스크/이슈(후속 조치)
  - ✅ `/study?...&n=1`에서 학습 완료 후 `퀴즈 시작` 링크가 목표 n으로 뒤바뀌던 이슈 수정 완료
    - 수정 커밋: `d1f41ae` (`quiz start n mismatch`)
    - 현재 상태: 학습 세션의 n을 그대로 전달

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
- [x] localStorage가 깨졌을 때(비정상 JSON) 기본값으로 복구 (unit test)
- [x] sessionStorage(학습 세션)가 없을 때 `/quiz` 진입 시 안전(가드 UI + 학습/홈 유도)
- [x] `/quiz/result` 새로고침/직접 진입 시 최근 결과 복원(local fallback, TTL 24h)
- [x] `/quiz/result` 24시간 TTL 만료 후 자동 정리(session/local) (unit test)
- [ ] n=15에서 모바일 스크롤/터치 실수 없이 진행 가능한지
- [x] 함정문제 옵션 중복(동일 텍스트) 자동 테스트로 방지

## 데이터 품질
- [x] meaning/reading이 비어있는 레코드 없음(0개 확인)
- [x] gradeLabel별 개수 확인(8=50,7=50,7Ⅱ=50,6=75,6Ⅱ=75,5=100,4=250,4Ⅱ=250; 총 900)

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

Top5 셀렉터 스모크(자동화 준비):
- `cd web && npm run check:top5`

참고:
- `next start`가 실행 중이면 `npm run build`가 `.next/lock` 때문에 실패할 수 있음 → 실행 중인 서버 종료 후 재시도

## 비기능
- [ ] Lighthouse 모바일 성능/접근성 기본 점검
- [ ] Vercel 배포 후 404/라우팅 정상

## 실기기 QA 게이트 (v1)

### 디바이스 우선순위
- P0: iOS Safari (주력 iPhone 1대 + 소화면 1대)
- P1: Android Chrome (대표 1대)
- P2: iPad Safari (가능하면)
- 참고: iOS 특화 체크 포인트는 `docs/qa-ios-safari.md`

### RC 코어 시나리오 (10)
1. 첫 방문 → 홈 진입 → 목표 변경 저장
2. 홈 → 학습 진입 → 카드 진행 완료
3. 학습 완료 → 퀴즈 시작(n 파라미터 보존)
4. 퀴즈 1문항 정답/오답 처리 + 다음 이동
5. 퀴즈 완료 → 결과 화면 진입
6. 결과 화면 새로고침 후 결과 복원(24h 이내)
7. 결과 화면에서 오답 다시풀기/다음 미션 CTA
8. `/progress` 진도/복습 대기/레거시 안내 동작
9. `/settings` 진입 및 목표/급수 변경 반영
10. 백/포워드/새로고침 반복 시 크래시/화이트스크린 없음

Top5 자동화 준비 문서: `docs/qe-top5-e2e.md`
RC 점검 기록 템플릿: `docs/rc-gate-template.md`
RC 실행 로그 예시: `docs/rc-runs/2026-02-15-p1.md`

### 릴리즈 블로커(P0)
- 학습 핵심 플로우 불가(학습 시작/문항 처리/진도 저장)
- iOS Safari에서 입력/버튼/UI 파손으로 진행 불가
- 데이터 무결성 손상(진도/정답 유실/중복)
- 재현 가능한 크래시/화이트스크린
- 보안/민감정보 노출

## D+1 ~ D+10 실행표 (QE)
- D+1: iOS Safari 코어 시나리오 1차
- D+2: Android Chrome 코어 시나리오 1차
- D+3: iOS 특화 이슈(100vh/safe-area/BFCache) 재검증
- D+4: 회귀 Top5 E2E 케이스 확정
- D+5: E2E 1차 CI 연결 + flaky 분류
- D+6: P0/P1 이슈 픽스 확인 회귀
- D+7: RC 코어 시나리오 재실행(실기기)
- D+8: 성능/오류 지표 체크(라이트)
- D+9: 릴리즈 문서(영향범위/Known Issues) 갱신
- D+10: Go/No-Go 리뷰
