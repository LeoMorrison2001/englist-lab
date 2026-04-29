import Dexie, { type Table } from 'dexie'

import type { StoredArticle } from '../types/ui'

class EnglishLabDatabase extends Dexie {
  articles!: Table<StoredArticle, number>

  constructor() {
    super('english-lab-db')

    this.version(1).stores({
      articles: '++id, updatedAt, createdAt, title',
    })

    this.version(2)
      .stores({
        articles: '++id, updatedAt, createdAt, lastReadAt, title',
      })
      .upgrade(async (tx) => {
        await tx
          .table('articles')
          .toCollection()
          .modify((article) => {
            article.lastReadAt ??= null
            article.readingProgress ??= 0
            article.annotations ??= []
          })
      })

    this.version(3)
      .stores({
        articles: '++id, updatedAt, createdAt, lastReadAt, title',
      })
      .upgrade(async (tx) => {
        await tx
          .table('articles')
          .toCollection()
          .modify((article) => {
            article.annotations = (article.annotations ?? []).map((annotation: StoredArticle['annotations'][number]) => ({
              ...annotation,
              note: annotation.note ?? '',
            }))
          })
      })

    this.version(4)
      .stores({
        articles: '++id, updatedAt, createdAt, lastReadAt, title',
      })
      .upgrade(async (tx) => {
        await tx
          .table('articles')
          .toCollection()
          .modify((article) => {
            article.annotations = (article.annotations ?? []).map((annotation: any) => ({
              id: annotation.id,
              type: normalizeType(annotation.type),
              text: annotation.text ?? '',
              context: annotation.context ?? '',
              note: annotation.note ?? '',
              start: annotation.start ?? 0,
              end: annotation.end ?? 0,
              color: normalizeColor(annotation.type, annotation.color),
              createdAt: annotation.createdAt ?? new Date().toISOString(),
            }))
          })
      })

    this.version(5)
      .stores({
        articles: '++id, updatedAt, createdAt, lastReadAt, title',
      })
      .upgrade(async (tx) => {
        await tx
          .table('articles')
          .toCollection()
          .modify((article) => {
            article.annotations = (article.annotations ?? [])
              .map((annotation: any) => normalizeAnnotation(annotation))
              .filter((annotation: NonNullable<ReturnType<typeof normalizeAnnotation>>) => annotation != null)
          })
      })
  }
}

function normalizeAnnotation(annotation: any) {
  if (!annotation || typeof annotation !== 'object') {
    return null
  }

  const start = Number.isFinite(annotation.start) ? annotation.start : 0
  const end = Number.isFinite(annotation.end) ? annotation.end : start

  return {
    id: annotation.id ?? `annotation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: normalizeType(annotation.type),
    text: typeof annotation.text === 'string' ? annotation.text : '',
    context: typeof annotation.context === 'string' ? annotation.context : '',
    note: typeof annotation.note === 'string' ? annotation.note : '',
    start,
    end,
    color: normalizeColor(annotation.type, annotation.color),
    createdAt: typeof annotation.createdAt === 'string' ? annotation.createdAt : new Date().toISOString(),
  }
}

function normalizeType(type: unknown): 'word' | 'grammar' | 'sentence' | 'focus' {
  if (type === 'grammar' || type === 'sentence' || type === 'focus') {
    return type
  }

  return 'word'
}

function normalizeColor(type: unknown, color: unknown): 'blue' | 'orange' | 'yellow' | 'red' {
  if (color === 'blue' || color === 'orange' || color === 'yellow' || color === 'red') {
    return color
  }

  const normalizedType = normalizeType(type)

  if (normalizedType === 'grammar') {
    return 'orange'
  }

  if (normalizedType === 'sentence') {
    return 'yellow'
  }

  if (normalizedType === 'focus') {
    return 'red'
  }

  return 'blue'
}

export const db = new EnglishLabDatabase()
