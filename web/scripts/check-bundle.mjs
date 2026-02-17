#!/usr/bin/env node
/**
 * 번들 사이즈 예산 체크
 * Usage: node scripts/check-bundle.mjs
 */
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BUDGET = {
  // 전체 JS 번들 (gzip 전 기준, Next.js+React19+데이터 감안)
  totalJsKB: 1200,
  // 개별 chunk 최대
  singleChunkKB: 300,
  // 전체 빌드 디렉토리 (.next, 캐시 포함)
  totalBuildMB: 250,
};

function walkDir(dir, ext) {
  const result = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...walkDir(full, ext));
      } else if (entry.name.endsWith(ext)) {
        result.push(full);
      }
    }
  } catch {
    // dir doesn't exist
  }
  return result;
}

function dirSize(dir) {
  let total = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        total += dirSize(full);
      } else {
        total += statSync(full).size;
      }
    }
  } catch {
    // dir doesn't exist
  }
  return total;
}

const buildDir = join(process.cwd(), '.next');
const jsFiles = walkDir(join(buildDir, 'static'), '.js');

let totalJS = 0;
let maxChunk = { name: '', size: 0 };
const violations = [];

for (const f of jsFiles) {
  const size = statSync(f).size;
  totalJS += size;
  const name = relative(buildDir, f);
  if (size > maxChunk.size) {
    maxChunk = { name, size };
  }
  if (size / 1024 > BUDGET.singleChunkKB) {
    violations.push(`⚠️  ${name}: ${(size / 1024).toFixed(1)} KB > ${BUDGET.singleChunkKB} KB`);
  }
}

const totalJSKB = totalJS / 1024;
const totalBuildBytes = dirSize(buildDir);
const totalBuildMB = totalBuildBytes / 1024 / 1024;

console.log('📦 Bundle Size Report');
console.log('═'.repeat(50));
console.log(`Total JS:     ${totalJSKB.toFixed(1)} KB  (budget: ${BUDGET.totalJsKB} KB)`);
console.log(`Largest chunk: ${(maxChunk.size / 1024).toFixed(1)} KB  (${maxChunk.name})`);
console.log(`Build dir:    ${totalBuildMB.toFixed(1)} MB  (budget: ${BUDGET.totalBuildMB} MB)`);
console.log(`JS files:     ${jsFiles.length}`);
console.log('═'.repeat(50));

if (totalJSKB > BUDGET.totalJsKB) {
  violations.push(`❌ Total JS ${totalJSKB.toFixed(1)} KB exceeds budget ${BUDGET.totalJsKB} KB`);
}
if (totalBuildMB > BUDGET.totalBuildMB) {
  violations.push(`❌ Build dir ${totalBuildMB.toFixed(1)} MB exceeds budget ${BUDGET.totalBuildMB} MB`);
}

if (violations.length > 0) {
  console.log('\nViolations:');
  violations.forEach((v) => console.log(v));
  process.exit(1);
} else {
  console.log('\n✅ All within budget');
}
