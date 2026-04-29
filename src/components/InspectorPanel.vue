<script setup lang="ts">
import type { AnnotationItem, ToolItem } from '../types/ui'

defineProps<{
  tools: ToolItem[]
  annotations: AnnotationItem[]
}>()
</script>

<template>
  <aside class="inspector-panel panel">
    <header class="inspector-panel__header">
      <div>
        <h2>标注工具</h2>
      </div>
    </header>

    <section class="panel-section">
      <div class="panel-section__title">
        <h3>当前可用</h3>
      </div>
      <div class="tool-grid">
        <button
          v-for="tool in tools"
          :key="tool.title"
          class="tool-card"
          :class="[
            `tool-card--${tool.color}`,
            { 'tool-card--disabled': tool.title !== '单词' },
          ]"
          type="button"
        >
          <strong>{{ tool.title }}</strong>
          <span>{{ tool.subtitle }}</span>
        </button>
      </div>
    </section>

    <section class="panel-section panel-section--grow annotation-section">
      <div class="panel-section__title">
        <h3>单词标注</h3>
        <span>{{ annotations.length }}</span>
      </div>
      <div class="annotation-list">
        <article
          v-for="annotation in annotations"
          :key="annotation.id"
          class="annotation-card"
          :class="`annotation-card--${annotation.color}`"
        >
          <strong>{{ annotation.excerpt }}</strong>
          <p class="annotation-card__note">
            {{ annotation.note || '暂无备注' }}
          </p>
        </article>

        <div v-if="annotations.length === 0" class="empty-state empty-state--annotation">
          <strong>还没有单词标注</strong>
          <p>在正文里选中文本，然后点“标注为单词”。</p>
        </div>
      </div>
    </section>
  </aside>
</template>
