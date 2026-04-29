import type { Component } from 'vue'

export type NavItem = {
  label: string
  icon: Component
  active?: boolean
}

export type ToolItem = {
  title: string
  subtitle: string
  color: string
}

export type StoredAnnotation = {
  id: string
  type: 'word'
  text: string
  context: string
  note: string
  start: number
  end: number
  color: 'blue'
  createdAt: string
}

export type AnnotationItem = {
  id: string
  type: string
  excerpt: string
  context: string
  note: string
  color: string
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
