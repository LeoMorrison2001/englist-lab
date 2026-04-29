<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { db } from './db/articles'
import InspectorPanel from './components/InspectorPanel.vue'
import LibraryPanel from './components/LibraryPanel.vue'
import ReaderWorkspace from './components/ReaderWorkspace.vue'
import SideNav from './components/SideNav.vue'
import { annotationItems, navItems, toolItems } from './mockData'
import type { ArticleListItem, StoredArticle } from './types/ui'

const articles = ref<StoredArticle[]>([])
const selectedArticleId = ref<number | null>(null)
const isImporting = ref(false)
const importError = ref('')
const searchQuery = ref('')

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
      dateLabel: formatDate(article.updatedAt),
      sizeLabel: formatFileSize(article.fileSize),
      selected: article.id === selectedArticleId.value,
    }))
})

const readerParagraphs = computed(() => {
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

const saveLabel = computed(() => {
  if (!selectedArticle.value) {
    return '等待导入文章'
  }

  return '已导入'
})

onMounted(async () => {
  await loadArticles()
})

async function loadArticles() {
  const storedArticles = await db.articles.orderBy('updatedAt').reverse().toArray()
  articles.value = storedArticles

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
  isImporting.value = true

  try {
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.txt')) {
        throw new Error(`仅支持导入 .txt 文件: ${file.name}`)
      }

      const now = new Date().toISOString()
      const content = normalizeTextContent(await readTextFile(file))
      const article: StoredArticle = {
        title: file.name,
        content,
        fileSize: file.size,
        createdAt: now,
        updatedAt: now,
      }

      const id = await db.articles.add(article)
      selectedArticleId.value = id
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

function splitParagraphs(content: string) {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\n+/g, ' ').trim())
    .filter(Boolean)
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
      @import-files="importFiles"
      @select-article="selectArticle"
      @update-search="searchQuery = $event"
    />
    <ReaderWorkspace
      :title="selectedArticle?.title ?? '未选择文章'"
      :word-count="readerWordCount"
      :save-label="saveLabel"
      :paragraphs="readerParagraphs"
      :is-empty="!selectedArticle"
    />
    <InspectorPanel :tools="toolItems" :annotations="annotationItems" />
  </div>
</template>
