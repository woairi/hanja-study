# Hanja Study (어문회 8급~5급)

초등학생이 **모바일 우선**으로 하루 5~10분씩 한자를 공부할 수 있는 무료 웹서비스 MVP.

- 커리큘럼: **한자능력검정(어문회) 급수 기준**
- 범위: **8급, 7급, 7급Ⅱ, 6급, 6급Ⅱ, 5급, 4급, 4급Ⅱ**
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

Vercel에서 GitHub 연동 후:
- Framework: Next.js
- **Root Directory: `web`**
- Build Command: `npm run build`

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

### 디버그(로컬)
- `telemetry`는 **서버로 전송되지 않고**, 이 기기 localStorage에만 카운트로 저장됩니다.
- 확인/초기화: `/about?debug=1`

필드(요약):
- `gradeLabel`: `8급|7급|7급Ⅱ|6급|6급Ⅱ|5급|4급|4급Ⅱ`
- `hanja`, `reading`, `meaning`, `radical`, `totalStrokes`
- `confusables`: 함정문제 품질을 위한 후보(현재는 자동/수동 보강 중)
- `exampleWord`, `exampleMeaning`: 예시 단어(학습/오답 피드백에 표시)

## Roadmap (다음 작업)

- `confusables` 자동/수동 보강 → 함정문제 품질 개선 (4급/4급Ⅱ 동음 기반 override seed 추가)
- `/progress`의 취약 TOP에 한자/뜻/음 표시
- 학습 세션 재개(중간에 나갔다 들어와도 이어서)
- PWA(홈 화면 추가) / 오프라인 캐시
- (선택) 쓰기/획순 UI

## License / Attribution

- 데이터 출처: https://github.com/rycont/hanja-grade-dataset (급수별 CSV)

---

Maintained with OpenClaw.
