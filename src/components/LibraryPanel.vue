<script setup lang="ts">
import { ref } from 'vue'

import type { ArticleListItem } from '../types/ui'

defineProps<{
  articles: ArticleListItem[]
  searchQuery: string
  isImporting: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  importFiles: [files: FileList | null]
  selectArticle: [id: number]
  updateSearch: [value: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('importFiles', target.files)
  target.value = ''
}
</script>

<template>
  <aside class="library-panel panel">
    <button class="primary-action" type="button" :disabled="isImporting" @click="openFilePicker">
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
          @click="emit('selectArticle', article.id)"
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
  </aside>
</template>
