# QE 노트 (QA 체크리스트)

## 스모크 테스트
- [ ] `/`에서 급수 카드 6개(8,7,7Ⅱ,6,6Ⅱ,5) 표시
- [ ] 오늘 목표(5/10/15) 변경 후 새로고침해도 유지
- [ ] 급수 선택 → `/study` 이동
- [ ] 학습 카드: 뜻/음 보기 토글 동작
- [ ] n개 카드 완료 후 “퀴즈 시작” 버튼 노출
- [ ] 퀴즈: 문제/선지 렌더링, 선택 후 다음 이동
- [ ] 퀴즈 종료 후 결과 화면
- [ ] `/progress` 진도 표시 (seen/mastered/due)

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

- [ ] `cd web && npm run predeploy` (lint/test/data/build)
- [ ] localStorage migration(legacy id → canonical id) 자동 테스트 통과
- [ ] SRS interval/오답 리셋(특히 4급/4급Ⅱ 하드모드) 자동 테스트 통과
- [ ] 함정문제(trap) 옵션 중복(동일 텍스트) 방지 자동 테스트 통과

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
