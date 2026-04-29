<script setup lang="ts">
import type { ArticleItem } from '../types/ui'

defineProps<{
  articles: ArticleItem[]
}>()
</script>

<template>
  <aside class="library-panel panel">
    <button class="primary-action" type="button">+ 导入文章</button>

    <label class="library-search">
      <span class="library-search__icon"></span>
      <input type="text" placeholder="搜索文章标题" />
    </label>

    <section class="panel-section panel-section--grow library-section">
      <div class="panel-section__title">
        <h2>我的文章</h2>
        <span>({{ articles.length }})</span>
      </div>
      <div class="article-list">
        <button
          v-for="article in articles"
          :key="article.title"
          class="article-card"
          :class="{ 'article-card--selected': article.selected }"
          type="button"
        >
          <div class="article-card__top">
            <strong>{{ article.title }}</strong>
            <span class="article-card__dot"></span>
          </div>
          <div class="article-card__meta">
            <span>{{ article.date }}</span>
            <span>{{ article.size }}</span>
          </div>
        </button>
      </div>
    </section>
  </aside>
</template>
