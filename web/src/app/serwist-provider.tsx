"use client";

import { SerwistProvider as BaseSerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

const isDev = process.env.NODE_ENV === "development";

export function SerwistProvider({
  children,
}: {
  swUrl?: string;
  children: ReactNode;
}) {
  // 개발: @serwist/turbopack 동적 빌드, 프로덕션: public/sw.js
  const url = isDev ? "/serwist/sw.js" : "/sw.js";
  return <BaseSerwistProvider swUrl={url}>{children}</BaseSerwistProvider>;
}
