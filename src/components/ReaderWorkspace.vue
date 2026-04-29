<script setup lang="ts">
defineProps<{
  title: string
  wordCount: number
  saveLabel: string
  paragraphs: string[]
  isEmpty: boolean
}>()
</script>

<template>
  <main class="reader-stage">
    <header class="reader-toolbar panel">
      <div class="reader-toolbar__title">
        <h2>{{ title }}</h2>
      </div>
    </header>

    <section class="paper panel">
      <div class="paper__texture"></div>
      <article v-if="!isEmpty" class="paper__content">
        <p v-for="paragraph in paragraphs" :key="paragraph" class="paper__paragraph">
          {{ paragraph }}
        </p>
      </article>
      <div v-else class="reader-empty-state">
        <strong>导入一篇文章开始阅读</strong>
        <p>导入 `.txt` 文件后，这里会显示文章内容。</p>
      </div>
    </section>

    <footer class="reader-footer panel">
      <div class="reader-footer__meta">字数: {{ wordCount }} 词</div>
      <div class="reader-footer__status">
        <span class="dot dot--green"></span>
        <span>{{ saveLabel }}</span>
      </div>
    </footer>
  </main>
</template>
