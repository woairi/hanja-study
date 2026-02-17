/**
 * Serwist Route Handler (Turbopack 모드)
 * — Service Worker 빌드 + 서빙을 담당하는 API 라우트
 */
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import type { NextRequest } from "next/server";

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

/**
 * Next.js 16 catch-all → params.path = string[]
 * @serwist/turbopack → params.path = string (단일)
 * 래퍼로 string[].join('/') 변환 후 전달
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const pathStr = Array.isArray(path) ? path.join("/") : path;

  // @serwist/turbopack의 GET은 params.path를 string으로 기대
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = serwistRoute.GET as any;
  return handler(req, { params: Promise.resolve({ path: pathStr }) });
}
