import type { Component } from 'vue'

export type AnnotationType = 'word' | 'grammar' | 'sentence' | 'focus'

export type NavItem = {
  label: string
  icon: Component
  active?: boolean
}

export type ToolItem = {
  type: AnnotationType
  title: string
  subtitle: string
  color: 'blue' | 'orange' | 'yellow' | 'red'
}

export type StoredAnnotation = {
  id: string
  type: AnnotationType
  text: string
  context: string
  note: string
  start: number
  end: number
  color: 'blue' | 'orange' | 'yellow' | 'red'
  createdAt: string
}

export type AnnotationItem = {
  id: string
  type: AnnotationType
  excerpt: string
  note: string
  color: 'blue' | 'orange' | 'yellow' | 'red'
}

export type AnnotationGroup = {
  type: AnnotationType
  title: string
  color: 'blue' | 'orange' | 'yellow' | 'red'
  items: AnnotationItem[]
}

export type StoredArticle = {
  id?: number
  title: string
  content: string
  fileSize: number
  createdAt: string
  updatedAt: string
  lastReadAt: string | null
  readingProgress: number
  annotations: StoredAnnotation[]
}

export type ArticleListItem = {
  id: number
  title: string
  dateLabel: string
  sizeLabel: string
  selected?: boolean
}

export type ReaderParagraph = {
  id: string
  text: string
  start: number
  end: number
}
