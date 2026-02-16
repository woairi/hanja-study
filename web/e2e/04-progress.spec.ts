/**
 * Top5 E2E 시나리오 #5: 진도 화면 확인
 */
import { test, expect } from "@playwright/test";

test.describe("시나리오 5: 진도 화면", () => {
  test("진도 페이지 로드 + 기본 콘텐츠 표시", async ({ page }) => {
    await page.goto("/progress");

    // 페이지 로드 확인
    await expect(page.locator("main")).toBeVisible();

    // "진도" 또는 "학습" 관련 텍스트
    await expect(
      page.getByRole("heading").first()
    ).toBeVisible();
  });

  test("학습 후 진도에 반영", async ({ page }) => {
    // 학습 1장 완료
    await page.goto("/study?grade=8급&n=1");
    await page.getByTestId("study-reveal").click();
    await page.getByTestId("study-next").click();

    // 진도 화면으로 이동
    await page.goto("/progress");
    await expect(page.locator("main")).toBeVisible();

    // 8급 관련 텍스트가 표시되어야 함 (첫 번째 매칭)
    await expect(page.getByText("8급", { exact: true }).first()).toBeVisible();
  });
});
