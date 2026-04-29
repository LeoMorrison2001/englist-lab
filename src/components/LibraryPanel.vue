<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ArticleListItem } from '../types/ui'

const props = defineProps<{
  articles: ArticleListItem[]
  searchQuery: string
  isImporting: boolean
  errorMessage: string
  noticeMessage: string
}>()

const emit = defineEmits<{
  importFiles: [files: FileList | null]
  selectArticle: [id: number]
  renameArticle: [payload: { id: number; title: string }]
  deleteArticle: [id: number]
  updateSearch: [value: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const contextMenu = ref<{ articleId: number; x: number; y: number } | null>(null)

const contextMenuArticle = computed(() => {
  if (!contextMenu.value) {
    return null
  }

  return props.articles.find((article) => article.id === contextMenu.value?.articleId) ?? null
})

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('importFiles', target.files)
  target.value = ''
}

function openContextMenu(article: ArticleListItem, event: MouseEvent) {
  event.preventDefault()
  contextMenu.value = {
    articleId: article.id,
    x: event.clientX,
    y: event.clientY,
  }
  emit('selectArticle', article.id)
}

function closeContextMenu() {
  contextMenu.value = null
}

function renameFromMenu() {
  if (!contextMenuArticle.value) {
    return
  }

  const nextTitle = window.prompt('重命名文章', contextMenuArticle.value.title)?.trim()

  if (!nextTitle || nextTitle === contextMenuArticle.value.title) {
    closeContextMenu()
    return
  }

  emit('renameArticle', {
    id: contextMenuArticle.value.id,
    title: nextTitle,
  })
  closeContextMenu()
}

function deleteFromMenu() {
  if (!contextMenuArticle.value) {
    return
  }

  emit('deleteArticle', contextMenuArticle.value.id)
  closeContextMenu()
}
</script>

<template>
  <aside class="library-panel panel" @click="closeContextMenu">
    <button class="primary-action" type="button" :disabled="isImporting" @click.stop="openFilePicker">
      {{ isImporting ? '导入中...' : '导入文章' }}
    </button>
    <input
      ref="fileInput"
      class="sr-only-file-input"
      type="file"
      accept=".txt,text/plain"
      multiple
      @change="handleFileChange"
    />

    <label class="library-search">
      <span class="library-search__icon"></span>
      <input
        :value="searchQuery"
        type="text"
        placeholder="搜索文章标题"
        @input="emit('updateSearch', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <p v-if="errorMessage" class="panel-feedback panel-feedback--error">
      {{ errorMessage }}
    </p>
    <p v-else-if="noticeMessage" class="panel-feedback panel-feedback--notice">
      {{ noticeMessage }}
    </p>

    <section class="panel-section panel-section--grow library-section">
      <div class="panel-section__title">
        <h2>我的文章</h2>
        <span>({{ articles.length }})</span>
      </div>

      <div class="article-list">
        <button
          v-for="article in articles"
          :key="article.id"
          class="article-card"
          :class="{ 'article-card--selected': article.selected }"
          type="button"
          @click.stop="emit('selectArticle', article.id)"
          @contextmenu="openContextMenu(article, $event)"
        >
          <div class="article-card__top">
            <strong>{{ article.title }}</strong>
            <span class="article-card__dot"></span>
          </div>
          <div class="article-card__meta">
            <span>{{ article.dateLabel }}</span>
            <span>{{ article.sizeLabel }}</span>
          </div>
        </button>

        <div v-if="articles.length === 0" class="empty-state">
          <strong>还没有文章</strong>
          <p>先导入 `.txt` 文件即可。</p>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="contextMenu"
        class="context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button class="context-menu__item" type="button" @click="renameFromMenu">
          重命名
        </button>
        <button class="context-menu__item context-menu__item--danger" type="button" @click="deleteFromMenu">
          删除
        </button>
      </div>
    </Teleport>
  </aside>
</template>
