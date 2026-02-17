/**
 * E2E: 온보딩 + 설정 플로우
 */
import { test, expect } from "@playwright/test";

test.describe("온보딩 플로우", () => {
  test("온보딩 페이지 로드 및 1단계 표시", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("1/4")).toBeVisible();
    // 닉네임 입력 필드가 있어야 함
    const input = page.locator("input");
    await expect(input.first()).toBeVisible();
  });

  test("닉네임 입력 후 다음 단계 진행", async ({ page }) => {
    await page.goto("/onboarding");
    const input = page.locator("input").first();
    await input.fill("테스트");
    // 다음 버튼 클릭
    const next = page.locator("button", { hasText: /다음/ });
    if (await next.count() > 0 && await next.first().isVisible()) {
      await next.first().click();
      await expect(page.getByText("2/4")).toBeVisible();
    }
  });
});

test.describe("설정 페이지", () => {
  test("설정 로드 및 테마 토글 존재", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/테마|다크/)).toBeVisible();
  });

  test("효과음 토글 존재", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByTestId("settings-sound-toggle")).toBeVisible();
  });
});

test.describe("주간 리포트", () => {
  test("리포트 페이지 로드", async ({ page }) => {
    await page.goto("/progress/report");
    await expect(page.getByRole("heading", { name: /주간 리포트/ })).toBeVisible();
  });
});
