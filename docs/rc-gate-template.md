# RC Gate Template (운영용)

릴리즈 후보(RC)마다 아래 템플릿을 복사해 기록한다.

## 기본 정보
- RC 버전/태그:
- 점검 일시(KST):
- 점검자:
- 기준 브랜치/커밋:

## 자동 게이트
- [ ] `cd web && npm run predeploy` PASS
- [ ] 핵심 테스트 실패 0건
- [ ] Top5 selector check PASS

## 실기기 게이트
- [ ] iOS Safari 코어 시나리오 PASS
- [ ] Android Chrome 코어 시나리오 PASS
- [ ] 회전/키보드/백-포워드 기본 체크 PASS

## 플로우 스모크
- [ ] Home → Study
- [ ] Study → Quiz (n 파라미터 유지)
- [ ] Quiz → Result
- [ ] Result 새로고침/직접진입 가드
- [ ] Progress/Settings 핵심 CTA

## 블로커 판정
- P0 블로커:
- P1 이슈(허용/보류):
- Known Issues:

## 최종 판정
- [ ] GO
- [ ] NO-GO
- 근거/메모:
