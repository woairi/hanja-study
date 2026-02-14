import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // MVP 단계에서는 localStorage/sessionStorage 동기화가 필요해서 effect 내부 setState를 허용.
      // (추후 state 초기화/외부스토어 패턴으로 정리 가능)
      'react-hooks/set-state-in-effect': 'off',
      // Date.now() 등을 초기 타임스탬프로 쓰는 패턴을 허용.
      'react-hooks/purity': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
