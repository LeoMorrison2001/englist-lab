<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { AnnotationGroup, AnnotationType } from '../types/ui'

const props = defineProps<{
  groups: AnnotationGroup[]
}>()

const emit = defineEmits<{
  focusAnnotation: [annotationId: string]
}>()

const activeType = ref<AnnotationType>('word')

const activeGroup = computed(() => {
  return props.groups.find((group) => group.type === activeType.value) ?? props.groups[0] ?? null
})

watch(
  () => props.groups,
  (groups) => {
    if (!groups.some((group) => group.type === activeType.value) && groups[0]) {
      activeType.value = groups[0].type
    }
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <aside class="inspector-panel panel">
    <header class="inspector-panel__header">
      <div>
        <h2>标注分类</h2>
      </div>
    </header>

    <div class="annotation-tabs" role="tablist" aria-label="标注分类">
      <button
        v-for="group in groups"
        :key="group.type"
        class="annotation-tab"
        :class="[
          `annotation-tab--${group.color}`,
          { 'annotation-tab--active': group.type === activeType },
        ]"
        type="button"
        role="tab"
        :aria-selected="group.type === activeType"
        @click="activeType = group.type"
      >
        <span>{{ group.title }}</span>
        <strong>{{ group.items.length }}</strong>
      </button>
    </div>

    <section v-if="activeGroup" class="annotation-panel">
      <div class="panel-section__title">
        <h3>{{ activeGroup.title }}</h3>
        <span>{{ activeGroup.items.length }}</span>
      </div>

      <div class="annotation-list annotation-list--panel" :class="`annotation-list--${activeGroup.type}`">
        <button
          v-for="annotation in activeGroup.items"
          :key="annotation.id"
          class="annotation-card annotation-card--button"
          :class="`annotation-card--${activeGroup.color}`"
          type="button"
          @click="emit('focusAnnotation', annotation.id)"
        >
          <strong>{{ annotation.excerpt }}</strong>
          <p class="annotation-card__note">{{ annotation.note || '暂无备注' }}</p>
        </button>

        <div v-if="activeGroup.items.length === 0" class="empty-state empty-state--annotation">
          <strong>暂无{{ activeGroup.title }}</strong>
          <p>在正文里选中文本后添加{{ activeGroup.title }}标注。</p>
        </div>
      </div>
    </section>
  </aside>
</template>
