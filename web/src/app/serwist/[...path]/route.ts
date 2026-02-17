/**
 * Serwist Route Handler
 * — 프로덕션: public/sw.js로 리다이렉트 (빌드 타임 생성)
 * — 개발: @serwist/turbopack으로 동적 빌드
 */
import { createSerwistRoute } from "@serwist/turbopack";
import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";

// 개발 환경에서만 동적 빌드 사용
const serwistRoute = isDev
  ? createSerwistRoute({
      additionalPrecacheEntries: [{ url: "/~offline", revision: "dev" }],
      swSrc: "src/app/sw.ts",
      useNativeEsbuild: true,
    })
  : null;

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const pathStr = Array.isArray(path) ? path.join("/") : path;

  // 프로덕션: public/sw.js로 리다이렉트
  if (!isDev && pathStr === "sw.js") {
    return NextResponse.redirect(new URL("/sw.js", req.url), 302);
  }

  // 개발: @serwist/turbopack 동적 빌드
  if (serwistRoute) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = serwistRoute.GET as any;
    return handler(req, { params: Promise.resolve({ path: pathStr }) });
  }

  return new NextResponse("Not Found", { status: 404 });
}
