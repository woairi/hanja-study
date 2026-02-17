# Hanja Study (어문회 8급~4급Ⅱ)

초등학생이 **모바일 우선**으로 하루 5~10분씩 한자를 공부할 수 있는 무료 웹서비스.

- 커리큘럼: **한자능력검정(어문회) 급수 기준**
- 범위: **8급, 7급, 7급Ⅱ, 6급, 6급Ⅱ, 5급, 4급, 4급Ⅱ** (총 900자)
- 로그인/계정: 없음 (학습 기록은 **이 기기(localStorage)** 에 저장)
- 퀴즈: 뜻/음 + **함정문제 20%**(비슷한 한자 구분)

## Repository 구조

- `web/` : Next.js (App Router) 프론트엔드
- `data/` : 원본 데이터(급수별 한자 목록 JSON)

## Quick Start (로컬 실행)

```bash
cd web
npm install
npm run dev
```

- 접속: <http://localhost:3000>

## Build / Production

```bash
cd web
npm run lint
npm run check:data
npm run build
npm run start
```

## Deploy (Vercel)

- **프로덕션**: https://hanja-study.vercel.app/
- GitHub 연동 자동 배포 (main 브랜치 push → Vercel 빌드)
- Framework: Next.js
- **Root Directory: `web`**
- Build Command: `npm run predeploy`

## 테스트

```bash
cd web
npm test              # Jest 유닛 (19건)
npm run test:e2e      # Playwright E2E (18건)
npm run predeploy     # 전체 (lint+test+top5+data+build-sw+build)
node scripts/check-bundle.mjs  # 번들 사이즈 예산 체크
```

## PWA (기반)

- `/manifest.webmanifest` 제공
- 홈 화면에 추가(설치) 가능하도록 metadata/아이콘 세팅
- 오프라인 상태를 감지해 상단 배너로 안내(학습은 계속 가능)

## 주요 화면

- `/` : 오늘 할 일(Primary CTA) + 접기(목표/뱃지/급수)
- `/study?grade=7급Ⅱ&n=10` : 학습 카드
- `/quiz` : 퀴즈(20% 함정문제)
- `/progress` : 진도/복습대기/취약 TOP
- `/about?debug=1` : (디버그) 로컬 사용 로그(telemetry) 보기/초기화

## 데이터

현재 데이터는 `data/kanji_8_to_5.json` (웹용 복사본: `web/src/data/kanji.json`)에 포함.

### 데이터 생성(재생성)
- 베이스(원본에 가까운) 데이터: `data/kanji_8_to_4.json`
- 생성 스크립트: `node data/build.mjs`  (base + overrides + 휴리스틱 → web/data 갱신)

### 디버그(로컬)
- `telemetry`는 **서버로 전송되지 않고**, 이 기기 localStorage에만 카운트로 저장됩니다.
- 확인/초기화: `/about?debug=1`

필드(요약):
- `gradeLabel`: `8급|7급|7급Ⅱ|6급|6급Ⅱ|5급|4급|4급Ⅱ`
- `hanja`, `reading`, `meaning`, `radical`, `totalStrokes`
- `confusables`: 함정문제 품질을 위한 후보(현재는 자동/수동 보강 중)
- `exampleWord`, `exampleMeaning`: 예시 단어(학습/오답 피드백에 표시)

## Roadmap

### ✅ 완료
- PWA + 오프라인 캐시 (Week 5)
- confusables 자동/수동 보강 (Week 5)
- 학습 세션 재개 — 4시간 TTL (Week 5)
- 다크모드 — 시스템 자동 + 수동 토글 (Week 5)
- 효과음 + 햅틱 피드백 (Week 5)
- OG 이미지 자동 생성 (Week 5)
- 접근성(a11y) 자동 점검 — axe-core (Week 5)
- Vercel 프로덕션 배포 (Week 6)
- 학습 통계 시각화 — 일별 문제 수 + 정답률 차트 (Week 6)
- Daily Mission 2.0 — 복습+약점+신규 혼합 맞춤 미션 (Week 7)
- 결과 감정 UX — 정답률 기반 피드백 + 어제 비교 (Week 7)
- 주간 리포트 카드 — 보호자 공유용 이미지 생성 (Week 7)
- 오답 이유 태깅 — 음/뜻/형태 혼동 자동 분류 + 코칭 (Week 7)
- 개인화 카피 — 성취 기반 인사/완료 메시지 (Week 7)
- 번들 사이즈 예산 체크 (Week 7)
- **급수 도전 (기출유형 학습)** — 7종 유형 자동 생성 시험 모드 (Week 8)
- **XP·레벨·뱃지 시스템** — 시험 합격 보상 + 이력 관리 (Week 8)
- **시험 결과 공유** — Canvas 이미지 + Web Share (Week 8)
- **사자성어/반대어/유의어 데이터** — 50+20+45개 큐레이션 (Week 8)

### 🔮 향후 고려
- 캐릭터/수집형 메타게임 (뱃지 도감, 레벨 타이틀)
- 친구/가족 소셜 기능 (주간 챌린지)
- 학년/수준별 개인화 추천

## License / Attribution

- 데이터 출처: https://github.com/rycont/hanja-grade-dataset (급수별 CSV)

---

Maintained with OpenClaw.
