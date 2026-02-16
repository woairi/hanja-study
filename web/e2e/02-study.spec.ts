/**
 * Top5 E2E 시나리오 #2: 학습 카드 진행 → 완료
 */
import { test, expect } from "@playwright/test";

test.describe("시나리오 2: 학습 카드 진행", () => {
  test("학습 카드 1장 진행 후 완료 화면 표시", async ({ page }) => {
    // n=1로 최소 학습
    await page.goto("/study?grade=8급&n=1");

    // 한자 카드가 보여야 함
    await expect(page.locator("main")).toBeVisible();

    // "뜻/음 보기" 버튼 클릭
    const reveal = page.getByTestId("study-reveal");
    await expect(reveal).toBeVisible();
    await reveal.click();

    // 뜻/음이 표시된 상태에서 "다음" 클릭 → 완료
    const next = page.getByTestId("study-next");
    await expect(next).toBeVisible();
    await next.click();

    // 완료 화면: "퀴즈 시작" 버튼 노출
    const quizStart = page.getByTestId("study-quiz-start");
    await expect(quizStart).toBeVisible();
  });

  test("완료 화면의 퀴즈 시작 링크에 n 파라미터 유지", async ({ page }) => {
    await page.goto("/study?grade=8급&n=1");

    const reveal = page.getByTestId("study-reveal");
    await reveal.click();

    const next = page.getByTestId("study-next");
    await next.click();

    // 퀴즈 시작 링크의 href 확인
    const quizStart = page.getByTestId("study-quiz-start");
    const href = await quizStart.getAttribute("href");
    expect(href).toContain("n=1");
  });
});
