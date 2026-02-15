# Changelog

이 프로젝트(Hanja Study) 변경 내역.

형식: Keep a Changelog 스타일(간단 버전).

## [Unreleased]

### Added
- Week1(P0): override 스키마 표준화(confusables/examples: 레코드 배열 + 메타 필드 id/target/reason/source/updated_at) + check:data에서 충돌/중복 검증
- Week1(P0): 데이터 manifest(`dataset_version/schema_version/build_id/checksum/created_at`) 생성 + web check:data에서 checksum/형식 검증
- Week1(QE/P0): 배포 블로커 3종(localStorage migration / SRS interval+오답 리셋 / trap 옵션 중복 방지) 유닛 테스트 + QE 문서 실행 커맨드 정리
- Week2: confusables 자동 보강(급수 내 동음/부수/획수 기반 휴리스틱) + 과도한 매칭 필터링(임계값/최대개수)
- Week2: PWA manifest/아이콘 기반 추가(installability 시작)
- Week2: 오프라인 상태 안내 배너(기반)
- Week3: 급수 확장 착수(4급 + 4급Ⅱ 데이터/화면 반영)
- Week3: 퀴즈 결과에서 “틀린 것만 다시” 미니 복습
- Week2(FE P5): /quiz/result 결과 요약 화면 개선(점수/정답률/획득XP 요약, 오답 탭→정답/해설 즉시 확인, CTA 2개: 오답 다시풀기/다음 미션, 퀴즈 완료 시 결과 화면으로 이동)
- Week3: 오답 시 한자=뜻+음(짧은 설명) 표시
- Week3: 오답 문제 자동 재출제(3문제 뒤 1회)
- Week3: 홈 화면에 “오늘의 복습” 카드(복습 대기 개수 + 원탭 복습)
- Week3: 4급/4급Ⅱ 동음(독음 동일) 기반 confusables override seed 추가
- Week3: 진도 화면에 급수별 약점 TOP(최대 3개) 표시 + 약점만 복습 CTA
- Week3: 학습 카드/오답 피드백에 예시 단어(시드) 표시(4급 일부 확장)
- Week3: 진도 화면 약점 TOP에 예시 단어 노출
- Week3: 복습/약점 복습의 최대 문제 수를 10으로 캡(피로도 방지)
- Week3: SRS 간격 튜닝(4급/4급Ⅱ은 복습을 더 촘촘하게)
- Week3: check:data에 예시 필드 검증 추가
- Week3: 홈 화면 IA 정리(Primary CTA 1개 + Secondary 1~2개, 목표/뱃지/급수는 접기)
- Week3: 홈 문구/상태 정리(요약 라인, 복습 0개 처리, CTA 문구 개선)
- Week3: 완료 화면에 보상/다음 행동 유도(약점/복습) 카드 추가
- Week3: 예시 단어 시드 확장(총 100+)
- Week3: check:data 강화(confusables 존재 검증/상한, 예시 길이/의존성 검증)
- Week3: 간단한 로컬 사용 로그(telemetry) 추가(Home/완료화면 주요 CTA)
- Week3: /about?debug=1 에 telemetry 확인/초기화 화면 추가(라벨/메타 표시)
- Week3: 완료 후 '약점 더 복습' 로직 개선(due 우선 + 약점)
- Week3: 완료 화면 문구가 매번 똑같지 않게(가벼운 변형)
- Week3: 예시 단어 2차 확장 + overrides에 없는 한자 키 정리
- Week3: confusables 샘플링 스크립트 추가(npm run sample:confusables)
- Week3: 4급/4급Ⅱ confusables 노이즈 절삭(시각 유사도 기반 필터 + 최대 4개 제한)
- Week3: 4급/4급Ⅱ 예시 단어 대량 확장(기본 meaning 기반 자동 채움)
- Week3: telemetry 디버그 요약(간단 퍼널) 추가(전환율/후속 CTA까지)
- Week3: 진도 화면에서 약점 TOP 50 export(복사/붙여넣기) 지원(큐레이션용)
- Week3: 로컬 저장된 progress id(예: 5-028) 자동 마이그레이션(5급-028) + export 안정화
- Week3: 취약 TOP은 오답 기반으로만 산정 + due 목록은 분리(큐레이션 정확도)
- Week3: 약점/due export에 ID-only 복사 버튼 추가(텔레그램 길이 제한 대응)
- Week3(FE P7): /progress/export 내보내기 마법사(4단계: 포맷→기간/양→미리보기→내보내기) + 실패 원인/재시도 + 완료 후 공유/닫기 CTA + 선택값 유지
- Week3: 약점(오답/우선 리스트) 기반 예시 단어 수동 큐레이션(1차)
- Week2(FE P6): /progress 대시보드 강화(주간/월간 토글, 빈 상태 가이드, 핵심 지표 카드, 색상 의존 완화)
- Week3: 퀴즈 피드백 강화(정답이어도 힌트는 짧게, 오답은 자세히)
- Week3: confusables 생성 로직 개선(같은 부수 후보 포함 + 더 엄격한 필터 + 수동 blocklist)
- Week3: 함정문제(trap)는 confusables 충분한 항목 위주로 출제(품질)
- Week3: 예시 단어 일부를 더 자연스러운 단어로 수동 보강(큐레이션)
- Week3: 한자 데이터 재생성 파이프라인 추가(data/build.mjs) + 전 급수 예시 자동 채움
- 함정문제용 `confusables` 스타터 세트 추가(초기 자형 혼동 그룹)
- 퀴즈 정답/오답 즉시 피드백(0.7초 하이라이트 + 정답 표시)
- 퀴즈 정답 시 미니 반짝(✨) 이펙트
- 홈 화면에 스티커형 뱃지(첫 공부/연속 3일/연속 7일)
- 진도 화면: 취약 TOP에 한자/뜻/음 표시 + 복습 대기 총합 표시
- 키즈 테마(하늘색 팔레트) + 공룡 마스코트
- 학습 완료 화면/퀴즈 결과 화면 중앙 정렬 + CTA 풀폭 버튼
- 퀴즈 화면: 선택지 크게 + 하단 고정 컨트롤 바(이전/확인)
- 퀴즈 화면: 확인 버튼 대비(활성/비활성) 강화 + 선택 체크 표시 + 문제 타입 칩(뜻/음/함정)
- 퀴즈 화면: 진행률 바 추가 + 정답 시 🎉 이펙트 + 다음 문제 전환 템포 완화(정답 1.0s / 오답 1.7s)
- 퀴즈 화면: 즉시 피드백 UI 컴포넌트화 + 힌트/연속정답 상태 표시, 전환 딜레이 상한(<=0.8s)
- 진도 화면: 복습 시작 CTA(원탭)
- 학습 화면: 복습 모드(reviewOnly) 추가(복습 대기만 출제 + 상단 🔁 복습 표시)
- 진도 화면: 복습 대기 0개일 때 토스트 안내
- 홈 화면: 이어하기(Resume) 버튼 + /resume 라우트
- 홈 화면: 오늘의 학습(마지막 선택 급수로 원탭 시작) CTA
- 홈 화면: 뱃지 탭 시 설명/축하 모달 + 퀴즈 50문제 뱃지
- 홈 화면: 급수별 공룡 친구(아이콘) 추가(단일 아이콘/크기 정돈)
- Week2(FE P2): /onboarding 온보딩 플로우(닉네임/목표/간단 진단) 추가 + 홈 미션 개인화 반영

### Changed
- Week1(P3): 퀴즈 플레이어 UI 표준화(`/quiz/:id`): 360px 기준 overflow/겹침 완화, 로딩 스켈레톤 추가, 피드백 영역 높이 예약으로 레이아웃 점프 최소화(문제 유형 공통 규칙 유지)
- Week1(P1): 홈 학습 루프 개편(첫 화면: 오늘 미션 + 이어하기 동시 노출, 메인 CTA 1탭 학습 진입, 신규/기존 상태 분기 명확화)
- 진행률 카드/버튼 스타일을 둥글고 두툼한 키즈 UI로 통일
- FE: 디자인 토큰(color/spacing/radius/type) 기반으로 globals 정리 + Card/Button 공통 컴포넌트 도입(점진적 치환)
- FE: prefers-reduced-motion(reduce)에서 학습/퀴즈 이펙트 애니메이션 비활성화

## [0.1.0] - 2026-02-14

### Added
- Next.js(App Router) + Tailwind 기반 모바일 우선 MVP
- 급수 선택(8/7/7Ⅱ/6/6Ⅱ/5) + 오늘 목표(5/10/15자)
- 학습 카드(`/study`): 한자 카드 + 뜻/음 보기
- 퀴즈(`/quiz`): 뜻/음 4지선다 + 함정문제 20%
- 진도(`/progress`): 급수별 진행률, 복습 대기 수, 취약 TOP10
- 로컬 저장소 기반 학습 기록(localStorage)
- 데이터: 어문회 급수 CSV 기반 400자(8급~5급 + 7/6급Ⅱ)
