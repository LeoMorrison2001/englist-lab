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
  }
}

export const db = new EnglishLabDatabase()
