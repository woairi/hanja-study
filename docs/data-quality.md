# Data Quality Notes

이 문서는 데이터 품질(특히 `confusables`, `exampleWord/Meaning`) 관련 규칙/도구를 정리합니다.

## check:data
- 위치: `web/scripts/check_data.mjs`
- 실행: `cd web && npm run check:data`

주요 검증:
- 필수 필드(id/gradeLabel/hanja/reading/meaning)
- gradeLabel 별 개수(expected)
- overrides 파일 스키마/충돌 검증(아래 참고)
- confusables:
  - 자기 자신 포함 금지
  - 중복 금지
  - 데이터셋에 실제 존재하는 한자인지 검증
  - 길이 상한(현재 8)
- examples:
  - exampleWord/exampleMeaning 공백 금지
  - 길이 상한(exampleWord 10, exampleMeaning 40)

## Confusables(함정문제)
목표: **동음(같은 읽기)만으로 과도하게 엮지 않고**, "모양이 비슷해서 헷갈릴" 후보를 주로 사용.

### 샘플링
- 실행: `cd web && npm run sample:confusables`
- 용도: 길이가 너무 긴 그룹/이상한 매칭이 섞인 케이스를 빠르게 발견

### 생성/정리(재생성 파이프라인)
- 스크립트: `data/build.mjs`
- 동작: overrides + 휴리스틱(동음 + 같은 부수) → 시각 유사도(부수/획수) 점수로 필터 → 최대 4개 캡
- 수동 제외(미세 조정): `data/confusables_blocklist.json`

### Overrides 스키마(표준)
Confusables/examples override 파일은 **중복/충돌을 기계적으로 잡기 위해** object-map 대신 배열 레코드로 관리합니다.

- 파일:
  - `data/confusables_overrides.json`
  - `data/examples_overrides.json`
- 필수 메타 필드(각 레코드):
  - `id`: 레코드 ID(유니크)
  - `target`: 적용 대상 한자(유니크)
  - `reason`: 왜 이 override가 필요한지(짧은 설명)
  - `source`: 출처(생성 스크립트/참고 자료/수정자 메모 등)
  - `updated_at`: ISO timestamp

충돌 규칙:
- 같은 파일 안에서 **id 중복** → 실패
- 같은 파일 안에서 **target 중복(override 충돌)** → 실패

> 주의: JSON object 키 중복은 파서가 마지막 값을 덮어써서(침묵) 추적이 어렵습니다. 배열 스키마로 강제하는 이유입니다.

### Prune(노이즈 절삭)
- 스크립트: `data/prune_confusables.mjs` (보조/실험용)

> 원칙: 함정문제는 "학습을 돕는 정도"만. 너무 어렵거나 납득이 안 되면 신뢰가 무너짐.

## Examples(예시 단어)
- 원본/수정 파일: `data/examples_overrides.json` (표준 override 스키마: `.overrides`는 레코드 배열)
- 반영 대상:
  - `data/kanji_8_to_5.json`
  - `web/src/data/kanji.json`

예시는 학습 카드와 오답 피드백에서 문맥으로 사용합니다.
