import type { CategoryType, MaterialWithContext, Subject } from '../../types/materials'

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  lecture: 'Lectures',
  tutorial: 'Tutorials',
  test: 'Tests',
  exam: 'Exam Papers',
  notes: 'Notes',
  lab: 'Labs',
  quiz: 'Quizzes',
  other: 'Other',
}

export function flattenMaterials(subjects: Subject[]): MaterialWithContext[] {
  const output: MaterialWithContext[] = []

  for (const subject of subjects) {
    for (const category of subject.categories) {
      for (const item of category.items) {
        output.push({
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          categoryType: category.type,
          categoryTitle: category.title,
          item,
        })
      }
    }
  }

  return output
}

export function findSubject(subjects: Subject[], subjectId: string): Subject | undefined {
  return subjects.find((subject) => subject.id === subjectId)
}

export function categoryCount(subject: Subject, categoryType: CategoryType): number {
  return subject.categories.find((category) => category.type === categoryType)?.items.length ?? 0
}
