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

const serwistRoute = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});

// Next.js 16은 route segment config를 정적 문자열로 요구
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

// Next.js 16의 catch-all은 string[] 파라미터를 기대하지만
// @serwist/turbopack은 string으로 선언되어 있어서 타입 캐스트
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = serwistRoute.GET as any;
