<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import InspectorPanel from './components/InspectorPanel.vue'
import LibraryPanel from './components/LibraryPanel.vue'
import ReaderWorkspace from './components/ReaderWorkspace.vue'
import SideNav from './components/SideNav.vue'
import { db } from './db/articles'
import { annotationGroupTemplates, annotationTools, navItems } from './mockData'
import type {
  AnnotationGroup,
  AnnotationItem,
  AnnotationType,
  ArticleListItem,
  ReaderParagraph,
  StoredAnnotation,
  StoredArticle,
} from './types/ui'

const articles = ref<StoredArticle[]>([])
const selectedArticleId = ref<number | null>(null)
const isImporting = ref(false)
const importError = ref('')
const importNotice = ref('')
const searchQuery = ref('')
const focusRequest = ref<{ annotationId: string; token: number } | null>(null)

let focusRequestToken = 0
let progressSaveTimer: ReturnType<typeof setTimeout> | null = null

const selectedArticle = computed(() => {
  if (selectedArticleId.value == null) {
    return null
  }

  return articles.value.find((article) => article.id === selectedArticleId.value) ?? null
})

const visibleArticles = computed<ArticleListItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return articles.value
    .filter((article) => article.id != null)
    .filter((article) => !query || article.title.toLowerCase().includes(query))
    .map((article) => ({
      id: article.id as number,
      title: article.title,
      dateLabel: formatDate(article.lastReadAt ?? article.updatedAt),
      sizeLabel: formatFileSize(article.fileSize),
      selected: article.id === selectedArticleId.value,
    }))
})

const readerParagraphs = computed<ReaderParagraph[]>(() => {
  if (!selectedArticle.value) {
    return []
  }

  return splitParagraphs(selectedArticle.value.content)
})

const readerWordCount = computed(() => {
  if (!selectedArticle.value) {
    return 0
  }

  return countWords(selectedArticle.value.content)
})

const readingProgressPercent = computed(() => {
  if (!selectedArticle.value) {
    return 0
  }

  return Math.round((selectedArticle.value.readingProgress ?? 0) * 100)
})

const saveLabel = computed(() => {
  if (!selectedArticle.value) {
    return '等待导入文章'
  }

  return `阅读进度 ${readingProgressPercent.value}%`
})

const annotationGroups = computed<AnnotationGroup[]>(() => {
  const byType = new Map<AnnotationType, AnnotationItem[]>()

  if (selectedArticle.value) {
    for (const annotation of [...selectedArticle.value.annotations].sort((left, right) => left.start - right.start)) {
      const items = byType.get(annotation.type) ?? []
      items.push({
        id: annotation.id,
        type: annotation.type,
        excerpt: annotation.text,
        note: annotation.note,
        color: annotation.color,
      })
      byType.set(annotation.type, items)
    }
  }

  return annotationGroupTemplates.map((group) => ({
    ...group,
    items: byType.get(group.type) ?? [],
  }))
})

onMounted(async () => {
  await loadArticles()
})

async function loadArticles() {
  const storedArticles = await db.articles.orderBy('updatedAt').reverse().toArray()
  articles.value = storedArticles.map(normalizeArticle)

  if (storedArticles.length === 0) {
    selectedArticleId.value = null
    return
  }

  const hasCurrentSelection = storedArticles.some((article) => article.id === selectedArticleId.value)
  selectedArticleId.value = hasCurrentSelection ? selectedArticleId.value : (storedArticles[0].id ?? null)
}

async function importFiles(files: FileList | null) {
  if (!files || files.length === 0) {
    return
  }

  importError.value = ''
  importNotice.value = ''
  isImporting.value = true

  try {
    const knownArticles = [...articles.value]
    const skippedTitles: string[] = []

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        throw new Error(`仅支持导入 .txt 文件: ${file.name}`)
      }

      const now = new Date().toISOString()
      const content = normalizeTextContent(await readTextFile(file))
      const exactDuplicate = knownArticles.find(
        (article) => article.title === file.name && normalizeTextContent(article.content) === content,
      )

      if (exactDuplicate) {
        skippedTitles.push(file.name)
        continue
      }

      const title = createUniqueArticleTitle(file.name, knownArticles)
      const article: StoredArticle = {
        title,
        content,
        fileSize: file.size,
        createdAt: now,
        updatedAt: now,
        lastReadAt: null,
        readingProgress: 0,
        annotations: [],
      }

      const id = await db.articles.add(toStoredArticleRecord(article))
      knownArticles.unshift({ ...article, id })
      selectedArticleId.value = id
    }

    if (skippedTitles.length > 0) {
      importNotice.value =
        skippedTitles.length === 1
          ? `已跳过重复文章: ${skippedTitles[0]}`
          : `已跳过 ${skippedTitles.length} 篇重复文章`
    }

    await loadArticles()
  } catch (error) {
    importError.value = error instanceof Error ? error.message : '导入失败，请重试。'
  } finally {
    isImporting.value = false
  }
}

function selectArticle(id: number) {
  selectedArticleId.value = id
}

async function renameArticle(payload: { id: number; title: string }) {
  const article = articles.value.find((item) => item.id === payload.id)
  const nextTitle = payload.title.trim()

  if (!article || !nextTitle || article.title === nextTitle) {
    return
  }

  const uniqueTitle = createUniqueArticleTitle(
    nextTitle,
    articles.value.filter((item) => item.id !== payload.id),
  )
  const nextUpdatedAt = new Date().toISOString()

  updateArticleInMemory(payload.id, {
    title: uniqueTitle,
    updatedAt: nextUpdatedAt,
  })

  await db.articles.update(payload.id, {
    title: uniqueTitle,
    updatedAt: nextUpdatedAt,
  })
}

async function deleteArticle(id: number) {
  const article = articles.value.find((item) => item.id === id)

  if (!article) {
    return
  }

  const shouldDelete = window.confirm(`删除文章《${article.title}》后将无法恢复，是否继续？`)

  if (!shouldDelete) {
    return
  }

  await db.articles.delete(id)
  articles.value = articles.value.filter((item) => item.id !== id)

  if (selectedArticleId.value === id) {
    selectedArticleId.value = articles.value[0]?.id ?? null
  }
}

function handleProgressChange(progress: number) {
  if (!selectedArticle.value || selectedArticle.value.id == null) {
    return
  }

  const normalizedProgress = clamp(progress, 0, 1)
  const articleId = selectedArticle.value.id

  updateArticleInMemory(articleId, {
    readingProgress: normalizedProgress,
    lastReadAt: new Date().toISOString(),
  })

  if (progressSaveTimer) {
    clearTimeout(progressSaveTimer)
  }

  progressSaveTimer = setTimeout(async () => {
    await db.articles.update(articleId, {
      readingProgress: normalizedProgress,
      lastReadAt: new Date().toISOString(),
    })
  }, 180)
}

async function handleCreateAnnotation(payload: { start: number; end: number; text: string; type: AnnotationType }) {
  if (!selectedArticle.value || selectedArticle.value.id == null) {
    return
  }

  const text = payload.text.trim()

  if (!text) {
    return
  }

  const sameTypeAnnotations = selectedArticle.value.annotations.filter(
    (annotation) => annotation.type === payload.type,
  )

  const hasSameAnnotation = sameTypeAnnotations.some(
    (annotation) => annotation.start === payload.start && annotation.end === payload.end,
  )

  if (hasSameAnnotation || hasOverlappingAnnotation(sameTypeAnnotations, payload.start, payload.end)) {
    return
  }

  const annotation: StoredAnnotation = {
    id: createId(),
    type: payload.type,
    text,
    context: buildAnnotationContext(selectedArticle.value.content, payload.start, payload.end),
    note: '',
    start: payload.start,
    end: payload.end,
    color: colorForType(payload.type),
    createdAt: new Date().toISOString(),
  }

  const nextAnnotations = [...selectedArticle.value.annotations, annotation]
  const nextUpdatedAt = new Date().toISOString()

  updateArticleInMemory(selectedArticle.value.id, {
    annotations: nextAnnotations,
    updatedAt: nextUpdatedAt,
  })

  await db.articles.update(selectedArticle.value.id, {
    annotations: toStoredAnnotationsRecord(nextAnnotations),
    updatedAt: nextUpdatedAt,
  })
}

async function handleDeleteAnnotation(annotationId: string) {
  if (!selectedArticle.value || selectedArticle.value.id == null) {
    return
  }

  const nextAnnotations = selectedArticle.value.annotations.filter((annotation) => annotation.id !== annotationId)
  const nextUpdatedAt = new Date().toISOString()

  updateArticleInMemory(selectedArticle.value.id, {
    annotations: nextAnnotations,
    updatedAt: nextUpdatedAt,
  })

  await db.articles.update(selectedArticle.value.id, {
    annotations: toStoredAnnotationsRecord(nextAnnotations),
    updatedAt: nextUpdatedAt,
  })
}

async function handleUpdateAnnotationNote(payload: { annotationId: string; note: string }) {
  if (!selectedArticle.value || selectedArticle.value.id == null) {
    return
  }

  const nextAnnotations = selectedArticle.value.annotations.map((annotation) => {
    if (annotation.id !== payload.annotationId) {
      return annotation
    }

    return {
      ...annotation,
      note: payload.note.trim(),
    }
  })
  const nextUpdatedAt = new Date().toISOString()

  updateArticleInMemory(selectedArticle.value.id, {
    annotations: nextAnnotations,
    updatedAt: nextUpdatedAt,
  })

  await db.articles.update(selectedArticle.value.id, {
    annotations: toStoredAnnotationsRecord(nextAnnotations),
    updatedAt: nextUpdatedAt,
  })
}

function focusAnnotation(annotationId: string) {
  focusRequestToken += 1
  focusRequest.value = {
    annotationId,
    token: focusRequestToken,
  }
}

function updateArticleInMemory(id: number, patch: Partial<StoredArticle>) {
  articles.value = articles.value.map((article) => {
    if (article.id !== id) {
      return article
    }

    return {
      ...article,
      ...patch,
    }
  })
}

function normalizeArticle(article: StoredArticle): StoredArticle {
  return {
    ...article,
    lastReadAt: article.lastReadAt ?? null,
    readingProgress: clamp(article.readingProgress ?? 0, 0, 1),
    annotations: (article.annotations ?? [])
      .map((annotation) => normalizeAnnotation(annotation))
      .filter((annotation): annotation is StoredAnnotation => annotation != null),
  }
}

function toStoredArticleRecord(article: StoredArticle): StoredArticle {
  return {
    ...article,
    annotations: toStoredAnnotationsRecord(article.annotations ?? []),
  }
}

function toStoredAnnotationsRecord(annotations: StoredAnnotation[]) {
  return annotations.map((annotation) => ({
    id: annotation.id,
    type: normalizeType(annotation.type),
    text: annotation.text,
    context: annotation.context,
    note: annotation.note,
    start: annotation.start,
    end: annotation.end,
    color: annotation.color ?? colorForType(normalizeType(annotation.type)),
    createdAt: annotation.createdAt,
  }))
}

function normalizeAnnotation(annotation: Partial<StoredAnnotation> | null | undefined) {
  if (!annotation) {
    return null
  }

  const normalizedType = normalizeType(annotation.type ?? 'word')
  const start = Number.isFinite(annotation.start) ? Number(annotation.start) : 0
  const end = Number.isFinite(annotation.end) ? Number(annotation.end) : start

  return {
    id: annotation.id ?? createId(),
    type: normalizedType,
    text: annotation.text ?? '',
    context: annotation.context ?? '',
    note: annotation.note ?? '',
    start,
    end,
    color: annotation.color ?? colorForType(normalizedType),
    createdAt: annotation.createdAt ?? new Date().toISOString(),
  }
}

function normalizeType(type: unknown): AnnotationType {
  if (type === 'grammar' || type === 'sentence' || type === 'focus') {
    return type
  }

  return 'word'
}

function colorForType(type: AnnotationType): 'blue' | 'orange' | 'yellow' | 'red' {
  if (type === 'grammar') {
    return 'orange'
  }

  if (type === 'sentence') {
    return 'yellow'
  }

  if (type === 'focus') {
    return 'red'
  }

  return 'blue'
}

function hasOverlappingAnnotation(annotations: StoredAnnotation[], start: number, end: number) {
  return annotations.some((annotation) => start < annotation.end && end > annotation.start)
}

function splitParagraphs(content: string): ReaderParagraph[] {
  const normalized = normalizeTextContent(content)
  const paragraphs: ReaderParagraph[] = []
  const regex = /\n\s*\n/g
  let cursor = 0
  let paragraphIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(normalized)) !== null) {
    const text = normalized.slice(cursor, match.index).replace(/\n+/g, ' ').trim()

    if (text) {
      const start = paragraphs.length === 0 ? 0 : paragraphs[paragraphs.length - 1].end + 2
      paragraphs.push({
        id: `paragraph-${paragraphIndex}`,
        text,
        start,
        end: start + text.length,
      })
      paragraphIndex += 1
    }

    cursor = match.index + match[0].length
  }

  const lastText = normalized.slice(cursor).replace(/\n+/g, ' ').trim()

  if (lastText) {
    const start = paragraphs.length === 0 ? 0 : paragraphs[paragraphs.length - 1].end + 2
    paragraphs.push({
      id: `paragraph-${paragraphIndex}`,
      text: lastText,
      start,
      end: start + lastText.length,
    })
  }

  return paragraphs
}

function buildAnnotationContext(content: string, start: number, end: number) {
  const paragraphs = splitParagraphs(content)
  const paragraph = paragraphs.find((item) => start >= item.start && end <= item.end)

  if (!paragraph) {
    return content.slice(Math.max(0, start - 30), Math.min(content.length, end + 30)).trim()
  }

  return paragraph.text
}

function normalizeTextContent(content: string) {
  return content.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').trim()
}

function countWords(content: string) {
  const matches = content.match(/[A-Za-z]+(?:'[A-Za-z]+)?|\d+/g)
  return matches?.length ?? 0
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `annotation-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createUniqueArticleTitle(title: string, existingArticles: Array<Pick<StoredArticle, 'title'>>) {
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

async function readTextFile(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const encodings = ['utf-8', 'gb18030']

  for (const encoding of encodings) {
    try {
      return new TextDecoder(encoding, { fatal: true }).decode(bytes)
    } catch {
      continue
    }
  }

  return new TextDecoder().decode(bytes)
}
</script>

<template>
  <div class="app-shell">
    <SideNav :items="navItems" />
    <LibraryPanel
      :articles="visibleArticles"
      :search-query="searchQuery"
      :is-importing="isImporting"
      :error-message="importError"
      :notice-message="importNotice"
      @import-files="importFiles"
      @select-article="selectArticle"
      @rename-article="renameArticle"
      @delete-article="deleteArticle"
      @update-search="searchQuery = $event"
    />
    <ReaderWorkspace
      :article-id="selectedArticle?.id ?? null"
      :title="selectedArticle?.title ?? '未选择文章'"
      :word-count="readerWordCount"
      :save-label="saveLabel"
      :tools="annotationTools"
      :paragraphs="readerParagraphs"
      :annotations="selectedArticle?.annotations ?? []"
      :reading-progress="selectedArticle?.readingProgress ?? 0"
      :focus-request="focusRequest"
      :is-empty="!selectedArticle"
      @progress-change="handleProgressChange"
      @create-annotation="handleCreateAnnotation"
      @delete-annotation="handleDeleteAnnotation"
      @update-annotation-note="handleUpdateAnnotationNote"
    />
    <InspectorPanel :groups="annotationGroups" @focus-annotation="focusAnnotation" />
  </div>
</template>
