<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import type { AnnotationType, ReaderParagraph, StoredAnnotation } from '../types/ui'

const props = defineProps<{
  articleId: number | null
  title: string
  wordCount: number
  saveLabel: string
  activeTool: AnnotationType
  paragraphs: ReaderParagraph[]
  annotations: StoredAnnotation[]
  readingProgress: number
  isEmpty: boolean
}>()

const emit = defineEmits<{
  progressChange: [progress: number]
  createAnnotation: [payload: { start: number; end: number; text: string; type: AnnotationType }]
  deleteAnnotation: [annotationId: string]
  updateAnnotationNote: [payload: { annotationId: string; note: string }]
}>()

const paperRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const isRestoringScroll = ref(false)
const selectionDraft = ref<{
  text: string
  start: number
  end: number
  top: number
  left: number
} | null>(null)
const activeAnnotationId = ref<string | null>(null)
const activeAnnotationNote = ref('')
const activeAnnotationMenu = ref<{ top: number; left: number } | null>(null)

const selectionLabel = computed(() => {
  return props.activeTool === 'word' ? '标注为单词' : '标注为语法'
})

const paragraphSegments = computed(() => {
  return props.paragraphs.map((paragraph) => ({
    ...paragraph,
    segments: buildSegments(paragraph, props.annotations),
  }))
})

const activeAnnotation = computed(() => {
  if (!activeAnnotationId.value) {
    return null
  }

  return props.annotations.find((annotation) => annotation.id === activeAnnotationId.value) ?? null
})

watch(
  () => [props.articleId, props.readingProgress, props.paragraphs.length, props.activeTool],
  async () => {
    await nextTick()
    restoreProgress()
    clearSelection()
    closeAnnotationMenu()
  },
  { immediate: true },
)

watch(
  () => props.annotations,
  () => {
    if (!activeAnnotationId.value) {
      return
    }

    const nextAnnotation = props.annotations.find((annotation) => annotation.id === activeAnnotationId.value)

    if (!nextAnnotation) {
      closeAnnotationMenu()
      return
    }

    activeAnnotationNote.value = nextAnnotation.note
  },
  { deep: true },
)

function handleScroll() {
  if (isRestoringScroll.value || !paperRef.value) {
    return
  }

  const element = paperRef.value
  const maxScroll = element.scrollHeight - element.clientHeight
  const progress = maxScroll <= 0 ? 0 : element.scrollTop / maxScroll
  emit('progressChange', progress)
  clearSelection()
  closeAnnotationMenu()
}

function handlePaperMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null

  if (target?.closest('.selection-action') || target?.closest('.annotation-editor')) {
    return
  }

  clearSelection()

  if (!target?.closest('.paper__annotation') && !target?.closest('.paper__grammar')) {
    closeAnnotationMenu()
  }
}

function restoreProgress() {
  if (!paperRef.value) {
    return
  }

  const element = paperRef.value
  const maxScroll = element.scrollHeight - element.clientHeight
  const nextScrollTop = maxScroll <= 0 ? 0 : props.readingProgress * maxScroll

  isRestoringScroll.value = true
  element.scrollTop = nextScrollTop

  requestAnimationFrame(() => {
    isRestoringScroll.value = false
  })
}

function handleParagraphMouseUp(paragraph: ReaderParagraph, event: MouseEvent) {
  const selection = window.getSelection()
  const paragraphElement = event.currentTarget as HTMLElement
  const target = event.target as HTMLElement | null

  if (target?.closest('.paper__annotation') || target?.closest('.paper__grammar')) {
    selectionDraft.value = null
    clearNativeSelection()
    return
  }

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    selectionDraft.value = null
    return
  }

  const range = selection.getRangeAt(0)

  if (
    !paragraphElement.contains(range.commonAncestorContainer) ||
    !paragraphElement.contains(range.startContainer) ||
    !paragraphElement.contains(range.endContainer)
  ) {
    selectionDraft.value = null
    return
  }

  const localStart = getOffsetWithinContainer(paragraphElement, range.startContainer, range.startOffset)
  const localEnd = getOffsetWithinContainer(paragraphElement, range.endContainer, range.endOffset)
  const selectedText = range.toString().replace(/\s+/g, ' ').trim()

  if (!selectedText || localEnd <= localStart) {
    selectionDraft.value = null
    return
  }

  const absoluteStart = paragraph.start + localStart
  const absoluteEnd = paragraph.start + localEnd

  const sameTypeAnnotations = props.annotations.filter((annotation) => annotation.type === props.activeTool)

  if (hasOverlappingAnnotation(sameTypeAnnotations, absoluteStart, absoluteEnd)) {
    selectionDraft.value = null
    clearNativeSelection()
    return
  }

  const rect = range.getBoundingClientRect()
  const contentRect = contentRef.value?.getBoundingClientRect()

  if (!contentRect) {
    return
  }

  closeAnnotationMenu()

  selectionDraft.value = {
    text: selectedText,
    start: absoluteStart,
    end: absoluteEnd,
    top: rect.top - contentRect.top - 48,
    left: rect.left - contentRect.left,
  }
}

function addAnnotation() {
  if (!selectionDraft.value) {
    return
  }

  emit('createAnnotation', {
    start: selectionDraft.value.start,
    end: selectionDraft.value.end,
    text: selectionDraft.value.text,
    type: props.activeTool,
  })

  clearSelection()
}

function handleAnnotationClick(annotationId: string, event: MouseEvent) {
  const annotation = props.annotations.find((item) => item.id === annotationId)
  const contentRect = contentRef.value?.getBoundingClientRect()
  const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect()

  if (!annotation || !contentRect) {
    return
  }

  clearSelection()
  activeAnnotationId.value = annotationId
  activeAnnotationNote.value = annotation.note
  activeAnnotationMenu.value = {
    top: targetRect.bottom - contentRect.top + 10,
    left: targetRect.left - contentRect.left,
  }
}

function saveActiveAnnotationNote() {
  if (!activeAnnotationId.value) {
    return
  }

  emit('updateAnnotationNote', {
    annotationId: activeAnnotationId.value,
    note: activeAnnotationNote.value,
  })
}

function deleteActiveAnnotation() {
  if (!activeAnnotationId.value) {
    return
  }

  emit('deleteAnnotation', activeAnnotationId.value)
  closeAnnotationMenu()
}

function closeAnnotationMenu() {
  activeAnnotationId.value = null
  activeAnnotationNote.value = ''
  activeAnnotationMenu.value = null
}

function clearSelection() {
  selectionDraft.value = null
  clearNativeSelection()
}

function clearNativeSelection() {
  window.getSelection()?.removeAllRanges()
}

function getOffsetWithinContainer(container: HTMLElement, targetNode: Node, targetOffset: number) {
  const range = document.createRange()
  range.selectNodeContents(container)
  range.setEnd(targetNode, targetOffset)
  return range.toString().length
}

function buildSegments(paragraph: ReaderParagraph, annotations: StoredAnnotation[]) {
  const relatedAnnotations = annotations
    .filter((annotation) => annotation.start < paragraph.end && annotation.end > paragraph.start)
    .sort((left, right) => left.start - right.start)

  if (relatedAnnotations.length === 0) {
    return [{ text: paragraph.text, wordId: null, grammarId: null }]
  }

  const boundarySet = new Set<number>([paragraph.start, paragraph.end])

  for (const annotation of relatedAnnotations) {
    boundarySet.add(Math.max(annotation.start, paragraph.start))
    boundarySet.add(Math.min(annotation.end, paragraph.end))
  }

  const boundaries = [...boundarySet].sort((left, right) => left - right)
  const segments: Array<{ text: string; wordId: string | null; grammarId: string | null }> = []

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]

    if (end <= start) {
      continue
    }

    const wordAnnotation = relatedAnnotations.find(
      (annotation) => annotation.type === 'word' && annotation.start <= start && annotation.end >= end,
    )
    const grammarAnnotation = relatedAnnotations.find(
      (annotation) => annotation.type === 'grammar' && annotation.start <= start && annotation.end >= end,
    )

    segments.push({
      text: paragraph.text.slice(start - paragraph.start, end - paragraph.start),
      wordId: wordAnnotation?.id ?? null,
      grammarId: grammarAnnotation?.id ?? null,
    })
  }

  return segments
}

function hasOverlappingAnnotation(annotations: StoredAnnotation[], start: number, end: number) {
  return annotations.some((annotation) => start < annotation.end && end > annotation.start)
}
</script>

<template>
  <main class="reader-stage">
    <header class="reader-toolbar panel">
      <div class="reader-toolbar__title">
        <h2>{{ title }}</h2>
      </div>
    </header>

    <section ref="paperRef" class="paper panel" @scroll="handleScroll" @mousedown="handlePaperMouseDown">
      <div class="paper__texture"></div>
      <article v-if="!isEmpty" ref="contentRef" class="paper__content">
        <button
          v-if="selectionDraft"
          class="selection-action"
          :class="`selection-action--${activeTool}`"
          type="button"
          :style="{ top: `${selectionDraft.top}px`, left: `${selectionDraft.left}px` }"
          @mousedown.stop.prevent
          @click.stop="addAnnotation"
        >
          {{ selectionLabel }}
        </button>

        <div
          v-if="activeAnnotation && activeAnnotationMenu"
          class="annotation-editor"
          :style="{ top: `${activeAnnotationMenu.top}px`, left: `${activeAnnotationMenu.left}px` }"
          @mousedown.stop
        >
          <strong class="annotation-editor__title">{{ activeAnnotation.text }}</strong>
          <p class="annotation-editor__context">{{ activeAnnotation.type === 'word' ? '单词标注' : '语法标注' }}</p>
          <textarea
            v-model="activeAnnotationNote"
            class="annotation-editor__input"
            rows="3"
            placeholder="给这个标注加备注"
          />
          <div class="annotation-editor__actions">
            <button class="annotation-editor__action annotation-editor__action--primary" type="button" @click="saveActiveAnnotationNote">
              保存备注
            </button>
            <button class="annotation-editor__action annotation-editor__action--danger" type="button" @click="deleteActiveAnnotation">
              删除标注
            </button>
          </div>
        </div>

        <p
          v-for="paragraph in paragraphSegments"
          :key="paragraph.id"
          class="paper__paragraph"
          @mouseup="handleParagraphMouseUp(paragraph, $event)"
        >
          <template v-for="(segment, index) in paragraph.segments" :key="`${paragraph.id}-${index}`">
            <span
              v-if="segment.grammarId"
              class="paper__grammar"
              @click.stop="!segment.wordId && handleAnnotationClick(segment.grammarId, $event)"
            >
              <mark
                v-if="segment.wordId"
                class="paper__annotation paper__annotation--blue"
                @click.stop="handleAnnotationClick(segment.wordId, $event)"
              >
                {{ segment.text }}
              </mark>
              <template v-else>{{ segment.text }}</template>
            </span>
            <mark
              v-else-if="segment.wordId"
              class="paper__annotation paper__annotation--blue"
              @click.stop="handleAnnotationClick(segment.wordId, $event)"
            >
              {{ segment.text }}
            </mark>
            <template v-else>{{ segment.text }}</template>
          </template>
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
