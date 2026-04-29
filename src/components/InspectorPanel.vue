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
        <h3>画笔工具</h3>
      </div>
      <div class="tool-grid">
        <button
          v-for="tool in tools"
          :key="tool.title"
          class="tool-card"
          :class="`tool-card--${tool.color}`"
          type="button"
        >
          <strong>{{ tool.title }}</strong>
          <span>{{ tool.subtitle }}</span>
        </button>
      </div>
    </section>

    <section class="panel-section panel-section--grow annotation-section">
      <div class="panel-section__title">
        <h3>标注列表</h3>
      </div>
      <div class="annotation-list">
        <article
          v-for="(annotation, index) in annotations"
          :key="`${annotation.type}-${index}`"
          class="annotation-card"
          :class="`annotation-card--${annotation.color}`"
        >
          <div class="annotation-card__meta">
            <span class="annotation-card__type">
              <span class="annotation-card__type-dot"></span>
              {{ annotation.type }}
            </span>
            <span>{{ index + 1 }}</span>
          </div>
          <strong>{{ annotation.excerpt }}</strong>
          <p>{{ annotation.note }}</p>
        </article>
      </div>
    </section>
  </aside>
</template>
