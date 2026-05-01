import type { StoredArticle } from '../types/ui'

export function createUniqueArticleTitle(title: string, existingArticles: Array<Pick<StoredArticle, 'title'>>) {
  const trimmedTitle = title.trim()
  const existingTitles = new Set(existingArticles.map((article) => article.title))

  if (!existingTitles.has(trimmedTitle)) {
    return trimmedTitle
  }

  const extensionIndex = trimmedTitle.lastIndexOf('.')
  const hasExtension = extensionIndex > 0
  const name = hasExtension ? trimmedTitle.slice(0, extensionIndex) : trimmedTitle
  const extension = hasExtension ? trimmedTitle.slice(extensionIndex) : ''

  let index = 2
  let candidate = `${name} (${index})${extension}`

  while (existingTitles.has(candidate)) {
    index += 1
    candidate = `${name} (${index})${extension}`
  }

  return candidate
}
