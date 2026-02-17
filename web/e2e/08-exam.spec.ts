/**
 * E2E: 급수 도전 기본 플로우
 */
import { test, expect } from "@playwright/test";

test.describe("급수 도전 플로우", () => {
  test("급수 도전 홈 페이지 로드", async ({ page }) => {
    await page.goto("/exam");
    await expect(page.getByRole("heading", { name: /급수 도전/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "8급" })).toBeVisible();
  });

  test("빠른 도전 시작 → 문제 화면 표시", async ({ page }) => {
    await page.goto("/exam/session?grade=8급&mode=quick");
    // 진행바가 보여야 함
    await expect(page.getByText(/1 \/ 10/)).toBeVisible();
    // 선택지 4개가 보여야 함
    const buttons = page.locator("button").filter({ hasNotText: /나가기/ });
    await expect(buttons.first()).toBeVisible();
  });

  test("문제 풀기 → 피드백 표시", async ({ page }) => {
    await page.goto("/exam/session?grade=8급&mode=quick");
    await page.waitForSelector("text=1 / 10");
    // 첫 번째 선택지 클릭
    const options = page.locator("button.rounded-2xl");
    await options.first().click();
    // 정답 또는 오답 피드백
    await expect(page.getByText(/정답|오답/).first()).toBeVisible();
  });
});
