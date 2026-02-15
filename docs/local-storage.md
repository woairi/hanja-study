# Local Storage / Migrations

이 문서는 Hanja Study의 로컬 저장소(localStorage/sessionStorage) 키와 마이그레이션 정책을 정리합니다.

## Primary state

- **Key**: `hanja-study:state`
- **Payload**: `AppState` JSON
  - `version` 필드로 스키마 버전을 관리합니다.

### Legacy keys

과거 릴리즈는 버전이 키 이름에 포함된 형태로 저장했습니다.

- `hanja-study:v1`

현재는 이 키를 **읽기만** 하고, 성공적으로 마이그레이션이 끝난 경우에만 `hanja-study:state`로 저장합니다.

## Migration policy (요약)

- 로드 순서
  1) `hanja-study:state`
  2) legacy keys (`hanja-study:v1` 등)
- 마이그레이션은 `vN -> vN+1` 형태로 단계적으로 수행
- **실패 시 안전복구**
  - 파싱/마이그레이션 실패 시 storage를 덮어쓰지 않음
  - 앱 부팅을 위해 기본값(`defaultState()`)으로 폴백

## Quiz result cache

- Session key: `hanja-study:quizResult`
- Local fallback key: `hanja-study:quizResult:last`
- 정책: 최근 퀴즈 결과를 최대 **24시간(TTL)** 보존
  - `/quiz/result` 새로고침/직접 진입 시 local fallback으로 복원
  - TTL 만료 시 session/local 모두 자동 정리

## Telemetry

- **Key**: `hanja-study:telemetry:v1`
- Meta snapshot (debug)
  - `hanja-study:telemetry:v1:meta:<event>` 형태로 저장
  - 정책: TTL 30일 + 최대 30개 cap
