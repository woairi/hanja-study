/**
 * Top5 E2E 시나리오 #3: 퀴즈 1문항 풀기
 * Top5 E2E 시나리오 #4: 퀴즈 완료 → 결과 화면
 */
import { test, expect } from "@playwright/test";

/** 학습 1장 완료 후 퀴즈 진입하는 헬퍼 */
async function studyThenQuiz(page: import("@playwright/test").Page) {
  await page.goto("/study?grade=8급&n=1");
  await page.getByTestId("study-reveal").click();
  await page.getByTestId("study-next").click();
  await page.getByTestId("study-quiz-start").click();
  // 퀴즈 화면 도달 대기
  await expect(page).toHaveURL(/\/quiz\//);
}

/** 퀴즈 문항을 하나 푸는 헬퍼 (선택 + 확인) */
async function answerOneQuestion(page: import("@playwright/test").Page) {
  const option1 = page.getByTestId("quiz-option-1");
  await expect(option1).toBeVisible({ timeout: 5000 });
  await option1.click();

  const confirm = page.getByTestId("quiz-confirm");
  await expect(confirm).toBeEnabled();
  await confirm.click();

  // 피드백 표시 대기
  await expect(
    page.locator("text=정답!").or(page.locator("text=아깝다!"))
  ).toBeVisible({ timeout: 3000 });
}

test.describe("시나리오 3: 퀴즈 1문항 풀기", () => {
  test("선택지 클릭 → 확인 → 피드백 표시", async ({ page }) => {
    await studyThenQuiz(page);
    await answerOneQuestion(page);
  });
});

test.describe("시나리오 4: 퀴즈 완료 → 결과 화면", () => {
  test("퀴즈 완료 후 결과 화면 진입", async ({ page }) => {
    await studyThenQuiz(page);

    // 오답 시 재출제가 있을 수 있으므로 결과 화면이 나올 때까지 반복
    // (최대 10문항 — n=1이라 보통 1~2문항)
    for (let i = 0; i < 10; i++) {
      // 결과 화면 도달 체크
      if (page.url().includes("/quiz/result")) break;

      const option1 = page.getByTestId("quiz-option-1");
      const isVisible = await option1.isVisible().catch(() => false);
      if (!isVisible) {
        // 피드백 전환 대기
        await page.waitForTimeout(1000);
        if (page.url().includes("/quiz/result")) break;
        continue;
      }
      await option1.click();
      const confirm = page.getByTestId("quiz-confirm");
      await confirm.click();
      // 피드백 전환 대기
      await page.waitForTimeout(1200);
    }

    // 결과 화면 도달 확인
    await expect(page).toHaveURL(/\/quiz\/result/, { timeout: 15000 });

    // 결과 화면 Primary CTA 확인
    const primaryCta = page.getByTestId("quiz-result-primary-cta");
    await expect(primaryCta).toBeVisible();
  });
});
