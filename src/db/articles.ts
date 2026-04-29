import Dexie, { type Table } from 'dexie'

import type { StoredArticle } from '../types/ui'

class EnglishLabDatabase extends Dexie {
  articles!: Table<StoredArticle, number>

  constructor() {
    super('english-lab-db')

    this.version(1).stores({
      articles: '++id, updatedAt, createdAt, title',
    })
  }
}

export const db = new EnglishLabDatabase()
