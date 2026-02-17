/**
 * 빌드 타임에 Service Worker를 esbuild로 번들링
 * — Vercel 서버리스에서 런타임 esbuild 실행 불가 문제 해결
 */
import { execSync, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SW_SRC = resolve(ROOT, 'src/app/sw.ts');
const OUT_DIR = resolve(ROOT, 'public');
const OUT_FILE = resolve(OUT_DIR, 'sw.js');

// git revision
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  Date.now().toString();

console.log(`[build-sw] revision: ${revision.slice(0, 8)}`);
console.log(`[build-sw] src: ${SW_SRC}`);

// esbuild로 SW 번들링
execSync(
  `npx esbuild ${SW_SRC} --bundle --outfile=${OUT_FILE} --format=esm --platform=browser --target=es2020 --define:process.env.NODE_ENV='"production"'`,
  { stdio: 'inherit', cwd: ROOT }
);

console.log(`[build-sw] output: ${OUT_FILE}`);
console.log('[build-sw] done ✅');
