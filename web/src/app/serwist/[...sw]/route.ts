/**
 * Serwist Route Handler (Turbopack 모드)
 * — Service Worker 빌드 + 서빙을 담당하는 API 라우트
 */
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// Git revision으로 프리캐시 버전 관리
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
