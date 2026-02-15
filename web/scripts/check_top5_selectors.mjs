import fs from 'node:fs';
import path from 'node:path';

const checks = [
  { file: 'src/app/page.tsx', token: 'data-testid="home-mission-cta"' },
  { file: 'src/app/study/StudyClient.tsx', token: 'data-testid="study-reveal"' },
  { file: 'src/app/study/StudyClient.tsx', token: 'data-testid="study-next"' },
  { file: 'src/app/study/StudyClient.tsx', token: 'data-testid="study-quiz-start"' },
  { file: 'src/app/quiz/[id]/QuizClient.tsx', token: 'data-testid="quiz-hint"' },
  { file: 'src/app/quiz/[id]/QuizClient.tsx', token: 'data-testid="quiz-confirm"' },
  { file: 'src/app/quiz/result/ResultClient.tsx', token: 'data-testid="quiz-result-primary-cta"' },
  { file: 'src/app/quiz/result/ResultClient.tsx', token: 'data-testid="quiz-result-next-mission"' },
  { file: 'src/app/progress/page.tsx', token: 'data-testid="progress-review-start"' },
  { file: 'src/app/settings/page.tsx', token: 'data-testid="settings-save"' },
  { file: 'src/app/settings/page.tsx', token: 'data-testid="settings-reset-open"' },
  { file: 'src/app/quiz/[id]/QuizClient.tsx', token: 'quiz-missing-start-study' },
  { file: 'src/app/quiz/result/ResultClient.tsx', token: 'quiz-result-missing-start' },
];

let failed = 0;
for (const c of checks) {
  const p = path.resolve(c.file);
  const txt = fs.readFileSync(p, 'utf8');
  if (!txt.includes(c.token)) {
    failed += 1;
    console.error(`missing selector: ${c.token} in ${c.file}`);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`✓ top5 selector check OK (${checks.length})`);
