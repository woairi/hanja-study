# Hanja Study — Web App

Next.js 16 + React 19 + Turbopack 기반 초등학생 한자 학습 웹앱.

## 기술 스택

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS
- **PWA**: @serwist/turbopack (오프라인 캐시, 프리캐시)
- **상태**: localStorage only (로그인 없음)
- **테스트**: Jest (유닛), Playwright (E2E), axe-core (접근성)
- **배포**: Vercel (GitHub 자동 배포)

## 디렉토리 구조

```
src/
├── app/              # Next.js App Router 페이지
│   ├── page.tsx          # 홈 (오늘 미션)
│   ├── study/            # 학습 카드
│   ├── quiz/             # 퀴즈 세션 + 결과
│   ├── progress/         # 진도 + 주간 리포트
│   ├── onboarding/       # 온보딩
│   └── settings/         # 설정
├── components/       # 공통 컴포넌트
│   └── ui/               # Button, Card, MiniBarChart, StateCard
├── lib/              # 비즈니스 로직
│   ├── learningSummary.ts    # due/weak/streak/mission 통합
│   ├── quizResult.ts         # 퀴즈 결과 + 오답 이유 분류
│   ├── storage.ts            # localStorage 상태 관리
│   ├── srs.ts                # SRS 간격반복 알고리즘
│   ├── kanji.ts              # 한자 데이터 접근
│   ├── copy.ts               # 개인화 메시지
│   └── telemetry.ts          # 로컬 텔레메트리
└── data/
    └── kanji.json        # 900자 한자 데이터 (8급~4급Ⅱ)
```

## 개발

```bash
npm install
npm run dev           # 개발 서버 (http://localhost:3000)
```

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm test` | Jest 유닛 테스트 (19건) |
| `npm run test:e2e` | Playwright E2E (18건) |
| `npm run predeploy` | 전체 배포 전 검증 |
| `npm run check:data` | 데이터 무결성 검증 |
| `npm run check:top5` | Top5 셀렉터 점검 |
| `node scripts/build-sw.mjs` | Service Worker 빌드 |
| `node scripts/check-bundle.mjs` | 번들 사이즈 예산 체크 |

## 환경 변수

| 변수 | 설명 | 필수 |
|---|---|---|
| `VERCEL_GIT_COMMIT_SHA` | SW precache revision (Vercel 자동 제공) | Vercel 배포 시 |
