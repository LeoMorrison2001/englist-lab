<script setup lang="ts">
defineProps<{
  title: string
  wordCount: number
  saveLabel: string
  paragraphs: string[]
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
      <article class="paper__content">
        <p v-for="paragraph in paragraphs" :key="paragraph" class="paper__paragraph">
          {{ paragraph }}
        </p>
      </article>
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
