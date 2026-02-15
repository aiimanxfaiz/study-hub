export type CategoryType = 'lecture' | 'tutorial' | 'test' | 'exam' | 'notes' | 'lab' | 'quiz' | 'other'

export interface MaterialImage {
  src: string
  width?: number
  height?: number
  alt: string
  pageNo: number
}

export interface MaterialItem {
  id: string
  title: string
  sourceHtml?: string
  images: MaterialImage[]
  textBlocks?: string[]
  tags: string[]
  termDateLabel?: string
}

export interface Category {
  type: CategoryType
  title: string
  items: MaterialItem[]
}

export interface Subject {
  id: string
  code: string
  name: string
  categories: Category[]
}

export interface MaterialsResponse {
  subjects: Subject[]
}

export interface MaterialWithContext {
  subjectId: string
  subjectCode: string
  subjectName: string
  categoryType: CategoryType
  categoryTitle: string
  item: MaterialItem
}
