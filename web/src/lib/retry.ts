import type { KanjiItem } from './types';
import type { QuizQuestion } from './quiz';
import { makeMeaningQ, makeReadingQ, makeTrapQ } from './quiz';

export function makeRetryQuestion(k: KanjiItem, pool: KanjiItem[], prefer?: QuizQuestion['kind']): QuizQuestion {
  const kinds: QuizQuestion['kind'][] = prefer ? [prefer, 'trap', 'meaning', 'reading'] : ['trap', 'meaning', 'reading'];
  for (const kind of kinds) {
    if (kind === 'trap') return { ...makeTrapQ(k, pool), id: '' };
    if (kind === 'meaning') return { ...makeMeaningQ(k, pool), id: '' };
    if (kind === 'reading') return { ...makeReadingQ(k, pool), id: '' };
  }
  return { ...makeTrapQ(k, pool), id: '' };
}
