/**
 * Top5 E2E 시나리오 #1: 앱 진입 + 홈 핵심 CTA
 */
import { test, expect } from "@playwright/test";

test.describe("시나리오 1: 홈 화면 진입", () => {
  test("홈 로드 후 미션 CTA가 노출되고 클릭 가능", async ({ page }) => {
    await page.goto("/");
    // 앱 타이틀 확인
    await expect(page).toHaveTitle(/한자/);
    // 메인 미션 CTA 확인
    const cta = page.getByTestId("home-mission-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test("미션 CTA 클릭 → /study로 이동", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByTestId("home-mission-cta");
    await cta.click();
    await expect(page).toHaveURL(/\/study/);
  });
});
