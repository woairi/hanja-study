/**
 * 접근성(a11y) 자동 점검 — axe-core + Playwright
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { name: "홈", path: "/" },
  { name: "진도", path: "/progress" },
  { name: "설정", path: "/settings" },
];

for (const { name, path } of PAGES) {
  test(`접근성 점검: ${name} (${path})`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    // 심각/치명적 위반만 실패 처리
    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    if (serious.length > 0) {
      const summary = serious
        .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
        .join("\n");
      console.log("접근성 위반 상세:\n" + summary);
    }

    expect(serious.length, `심각한 접근성 위반 ${serious.length}건`).toBe(0);
  });
}
