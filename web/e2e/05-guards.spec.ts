/**
 * 가드/예외 시나리오: 세션 없이 퀴즈/결과 직접 진입
 */
import { test, expect } from "@playwright/test";

test.describe("가드: 세션 없이 직접 진입", () => {
  test("퀴즈 세션 없이 /quiz 진입 시 가드 UI", async ({ page }) => {
    await page.goto("/quiz");

    // 가드 UI: 학습 시작 또는 홈 CTA가 노출
    await expect(
      page.getByTestId("quiz-missing-start-study")
    ).toBeVisible();
  });

  test("결과 없이 /quiz/result 진입 시 가드 UI", async ({ page }) => {
    // localStorage 비우기
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.removeItem("hanja-study:quizResult:v1");
      window.sessionStorage.clear();
    });

    await page.goto("/quiz/result");

    // 가드 UI: 퀴즈 다시 시작 또는 홈 CTA가 노출
    await expect(
      page.getByTestId("quiz-result-missing-start")
    ).toBeVisible();
  });
});
