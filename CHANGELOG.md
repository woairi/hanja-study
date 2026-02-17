# Changelog

이 프로젝트(Hanja Study) 변경 내역.

형식: Keep a Changelog 스타일(간단 버전).

## [Week 7] — 2026-02-17

### Added
- **Daily Mission 2.0**: 복습(40%)+약점(30%)+신규 혼합 맞춤 미션 알고리즘 (`dailyMissionItems`)
- **학습 요약 통합 모듈** (`lib/learningSummary.ts`): due/weak/streak/periodSummary/gradeStats 중복 로직 통합
- **학습 통계 시각화**: MiniBarChart SVG 컴포넌트, 진도 페이지에 일별 문제 수 + 정답률 차트
- **결과 감정 UX**: 정답률 기반 4단계 피드백 (만점/80%+/50%+/기타) + 어제 대비 정답률 향상 표시
- **주간 리포트 카드** (`/progress/report`): Canvas API 이미지 생성 + Web Share API 공유 + PNG 다운로드
- **모바일 하단 고정 CTA**: 홈 페이지 엄지 영역에 미션 시작 버튼 고정
- **오답 이유 태깅**: 자동 분류 (음 혼동/뜻 혼동/형태 혼동) + 결과 화면 코칭 메시지
- **개인화 카피**: streak/마스터 기반 홈 인사, 학습 완료 메시지 다양화 (`homeGreeting`, `studyDoneMessage`)
- **번들 사이즈 예산 체크** (`scripts/check-bundle.mjs`): JS/chunk/빌드 디렉토리 예산 검증
- **E2E 확장**: 온보딩/설정/주간 리포트 5건 추가 → 총 18 E2E
- **유닛 테스트**: learningSummary 7건 추가 → 총 19 유닛
- 진도 페이지에 '📊 주간 리포트' 링크

### Changed
- README 정합화: "8급~5급" → "8급~4급Ⅱ" (900자)
- 진도 페이지: 개발자용 텍스트를 아동 친화적 문구로 변경
- QuizResultPayload에 `wrongDetails` 필드 추가 (오답 이유 + 선택 기록)
- QuizClient answers에 `chosenId` 필드 추가

## [Week 6] — 2026-02-17

### Added
- **Vercel 프로덕션 배포**: https://hanja-study.vercel.app/ 라이브
- **빌드 타임 SW 생성** (`scripts/build-sw.mjs`): Vercel 서버리스 환경에서 esbuild 런타임 실행 불가 → 빌드 시 `public/sw.js` 생성
- `vercel.json` 설정 (framework/buildCommand/installCommand)
- `metadataBase` 설정 → OG 태그 정상 동작 확인

### Fixed
- Service Worker 500 에러: Vercel 서버리스에 git CLI 없음 → VERCEL_GIT_COMMIT_SHA + 빌드 타임 생성으로 해결
- `/quiz/page.tsx` searchParams Promise: Next.js 16 async API 대응
- `@serwist/turbopack` dev 서버 에러: `string[]` → `string` 래퍼

## [Week 5] — 2026-02-15

### Added
- **PWA Service Worker + 오프라인 캐시**: `@serwist/turbopack` 기반, 프리캐시+런타임캐시+`/~offline` 폴백
- **Playwright E2E Top5**: 13 테스트 (홈→학습→퀴즈→결과→진도 + 가드 + a11y)
- **predeploy 파이프라인**: lint → test → check:top5 → check:data → build-sw → build
- **스와이프 제스처**: `useSwipe` 훅, 학습 카드 좌우 넘기기
- **다크모드**: `useTheme` 훅 + ThemeScript FOUC 방지 + 설정 토글 (system/light/dark)
- **OG 이미지 자동 생성**: next/og 1200×630
- **접근성 점검**: axe-core WCAG 2.0 AA, 심각 위반 0건
- **학습 세션 만료 정책**: 4시간 TTL
- **효과음 + 햅틱 피드백**: Web Audio API + Vibration API, 음소거 토글
- **confusables 3차 품질 개선**: 동음 기반 +65개, 미보유 81→55

## [Week 4] — 2026-02-14

### Added
- 퀴즈 결과 localStorage fallback + TTL(24h)
- 설정: 학습 기록 초기화 2단 안전장치 (동의 체크 + `RESET` 입력)
- 설정: 저장 상태 요약 (학습 기록 수/최근 학습일/퀴즈 결과 캐시)
- /progress 레거시 안내 전환 UX (백업 CTA, 다시 보지 않기)
- /quiz/result 하단 고정 Primary CTA
- 공통 StateCard 컴포넌트
- 퀴즈 힌트 버튼 상태 명확화
- QE: 실기기 QA 게이트 v1 + D+1~D+10 실행표
- QE: storage fallback 안전성 테스트
- QE: iOS Safari known issues 문서
- QE: RC 운영 템플릿

## [Week 3] — 2026-02-12

### Added
- 급수 확장: 4급 + 4급Ⅱ (총 900자)
- 퀴즈 "틀린 것만 다시" 미니 복습

## [Week 2] — 2026-02-10

### Added
- confusables 자동 보강 (급수 내 동음/부수/획수 휴리스틱)
- PWA manifest/아이콘 기반
- 오프라인 상태 안내 배너
- /quiz/result 결과 요약 화면 개선
- /quiz/result 직접 진입 가드 UI

## [Week 1] — 2026-02-08

### Added
- 프로젝트 초기 구조 (Next.js App Router + React 19)
- 학습 카드 (한자/뜻/음/예시)
- 퀴즈 (4지선다 + 함정문제 confusables)
- SRS 간격반복 알고리즘
- 진도/스트릭/XP/레벨 시스템
- 온보딩 (닉네임/목표/시작 급수)
- localStorage 기반 상태 관리
- override 스키마 표준화 + check:data 검증
- 데이터 manifest + checksum 검증
