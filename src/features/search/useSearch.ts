import { useMemo, useState } from 'react'
import type { CategoryType, MaterialWithContext } from '../../types/materials'

export interface SearchState {
  query: string
  subjectId: string
  categoryType: '' | CategoryType
  sort: 'relevance' | 'title'
}

export function useSearch(materials: MaterialWithContext[]) {
  const [state, setState] = useState<SearchState>({
    query: '',
    subjectId: '',
    categoryType: '',
    sort: 'relevance',
  })

  const results = useMemo(() => {
    const query = state.query.trim().toLowerCase()

    const scored = materials
      .filter((material) => {
        if (state.subjectId && material.subjectId !== state.subjectId) return false
        if (state.categoryType && material.categoryType !== state.categoryType) return false
        if (!query) return true

        const haystack = [
          material.subjectCode,
          material.subjectName,
          material.categoryTitle,
          material.item.title,
          material.item.termDateLabel ?? '',
        ]
          .join(' ')
          .toLowerCase()

        return haystack.includes(query)
      })
      .map((material) => {
        if (!query) return { material, score: 0 }

        let score = 0
        const title = material.item.title.toLowerCase()
        const subject = `${material.subjectCode} ${material.subjectName}`.toLowerCase()

        if (title.includes(query)) score += 5
        if (subject.includes(query)) score += 3
        if ((material.item.termDateLabel ?? '').toLowerCase().includes(query)) score += 2

        return { material, score }
      })

    if (state.sort === 'title') {
      scored.sort((a, b) => a.material.item.title.localeCompare(b.material.item.title))
    } else {
      scored.sort((a, b) => b.score - a.score || a.material.item.title.localeCompare(b.material.item.title))
    }

    return scored.map((entry) => entry.material)
  }, [materials, state])

  return {
    state,
    setState,
    results,
  }
}
