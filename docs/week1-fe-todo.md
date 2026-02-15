# Week1 FE TODO (P8/P1/P3/P4)

## P8: 디자인 토큰/접근성 기반 (진행중)
- [ ] inline style(`var(--muted)` 등) → `TextMuted` 같은 공통 클래스/컴포넌트로 치환
- [ ] Link에도 Button 스타일을 쉽게 적용할 수 있도록 `ButtonLink`(Next Link wrapper) 도입
- [ ] Study/Progress 화면의 `btn/card` 하드코딩도 `Button/Card` 컴포넌트로 점진 치환
- [ ] select/input 등 폼 컨트롤 토큰화(배경/보더/포커스) + 44px 터치 타겟 검토

## 접근성
- [ ] `focus-ring` 적용 범위 점검(키보드 탐색 시에만 노출되도록 유지)
- [ ] 색 대비(특히 ghost 버튼/칩/비활성 상태) 360x800 기준 점검

## P1/P3/P4 (후속)
- [ ] (P1) 텍스트/레이아웃 360x800에서 줄바꿈/오버플로우 케이스(긴 뜻/예시) 처리
- [ ] (P3) 다크모드 색 토큰 미세 조정(서피스/보더 대비)
- [ ] (P4) 모션/전환(퀴즈 다음문제 전환 등) reduced-motion 추가 지점 재점검
