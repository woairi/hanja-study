import kanjiData from '@/data/kanji.json';
import type { GradeLabel, KanjiItem } from './types';

export const ALL_KANJI: KanjiItem[] = kanjiData as unknown as KanjiItem[];

export const GRADE_LABELS: GradeLabel[] = ['8급', '7급', '7급Ⅱ', '6급', '6급Ⅱ', '5급', '4급', '4급Ⅱ'];

// Precompute grade -> items map once (many screens call this frequently).
const BY_GRADE: Record<GradeLabel, KanjiItem[]> = GRADE_LABELS.reduce(
  (acc, label) => {
    acc[label] = ALL_KANJI.filter((k) => k.gradeLabel === label);
    return acc;
  },
  {} as Record<GradeLabel, KanjiItem[]>
);

export function kanjiByGradeLabel(label: GradeLabel): KanjiItem[] {
  return BY_GRADE[label] || [];
}

export function todayKey(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
