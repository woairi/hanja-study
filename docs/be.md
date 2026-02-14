# BE(로직/데이터) 노트

> 이 프로젝트는 서버가 없는(static) MVP라 "BE"는 데이터/상태/알고리즘 관점의 문서다.

## 데이터
- 원본: `data/kanji_8_to_5.json`
- 웹 번들: `web/src/data/kanji.json`
- 핵심 필드: `id`, `gradeLabel`, `hanja`, `reading`, `meaning`, `radical`, `totalStrokes`, `confusables[]`

## 상태 저장
- localStorage key: `hanja-study:v1`
- 포함:
  - settings: dailyCount(5/10/15)
  - streak
  - progress: id별 정답/오답/연속정답/nextReviewAt/mastered

## SRS 라이트(현재 구현)
- 정답: +3일, 연속 2회면 +7일
- 연속 4회면 mastered 처리(+30일)
- 오답: +1일, 연속정답 리셋

## 학습 아이템 선택
- 우선순위: due(복습 기한 지난 것) → fresh(처음) → 나머지 not-mastered에서 랜덤 채움

## 함정문제(20%)
- 의미/읽기 문제 일부를 trap으로 대체
- trap 옵션은 `confusables` 우선, 없으면 같은 급수 pool에서 랜덤 보충

## 다음 기술 부채
- `confusables` 데이터 생성 파이프라인(자동) 추가
- 학습 세션을 localStorage로도 저장해서 새로고침/복귀 시 복원
