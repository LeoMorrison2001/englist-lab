<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import AnnotationSegment from './AnnotationSegment.vue'
import type { AnnotationType, ReaderParagraph, StoredAnnotation, ToolItem } from '../types/ui'

const props = defineProps<{
  articleId: number | null
  title: string
  wordCount: number
  saveLabel: string
  tools: ToolItem[]
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
  () => [props.articleId, props.readingProgress, props.paragraphs.length],
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

  if (target?.closest('.selection-toolbar') || target?.closest('.annotation-editor')) {
    return
  }

  clearSelection()

  if (!target?.closest('.paper__annotated')) {
    closeAnnotationMenu()
  }
}

function handlePaperMouseUp(event: MouseEvent) {
  const selection = window.getSelection()
  const target = event.target as HTMLElement | null

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    if (target?.closest('.paper__annotated')) {
      selectionDraft.value = null
      return
    }

    selectionDraft.value = null
    return
  }

  const range = selection.getRangeAt(0)
  const startParagraphElement = getParagraphElement(range.startContainer)
  const endParagraphElement = getParagraphElement(range.endContainer)

  if (!startParagraphElement || !endParagraphElement) {
    selectionDraft.value = null
    return
  }

  const paragraphId = startParagraphElement.dataset.paragraphId

  if (!paragraphId || paragraphId !== endParagraphElement.dataset.paragraphId) {
    selectionDraft.value = null
    return
  }

  const paragraph = props.paragraphs.find((item) => item.id === paragraphId)

  if (!paragraph) {
    selectionDraft.value = null
    return
  }

  applySelectionDraft(paragraph, range)
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

function applySelectionDraft(paragraph: ReaderParagraph, range: Range) {
  const paragraphElement = contentRef.value?.querySelector<HTMLElement>(`[data-paragraph-id="${paragraph.id}"]`)

  if (!paragraphElement) {
    selectionDraft.value = null
    return
  }

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
  const rect = range.getBoundingClientRect()
  const paperRect = paperRef.value?.getBoundingClientRect()

  if (!paperRect || !paperRef.value) {
    selectionDraft.value = null
    return
  }

  closeAnnotationMenu()

  selectionDraft.value = {
    text: selectedText,
    start: absoluteStart,
    end: absoluteEnd,
    top: rect.top - paperRect.top - 54 + paperRef.value.scrollTop,
    left: rect.left - paperRect.left + paperRef.value.scrollLeft,
  }
}

function createAnnotation(type: AnnotationType) {
  if (!selectionDraft.value) {
    return
  }

  const sameTypeAnnotations = props.annotations.filter((annotation) => annotation.type === type)

  if (hasOverlappingAnnotation(sameTypeAnnotations, selectionDraft.value.start, selectionDraft.value.end)) {
    clearSelection()
    return
  }

  emit('createAnnotation', {
    start: selectionDraft.value.start,
    end: selectionDraft.value.end,
    text: selectionDraft.value.text,
    type,
  })

  clearSelection()
}

function handleAnnotationClick(annotationId: string, event: MouseEvent) {
  const annotation = props.annotations.find((item) => item.id === annotationId)
  const paperRect = paperRef.value?.getBoundingClientRect()
  const targetRect = (event.currentTarget as HTMLElement).getBoundingClientRect()

  if (!annotation || !paperRect || !paperRef.value) {
    return
  }

  clearSelection()
  activeAnnotationId.value = annotationId
  activeAnnotationNote.value = annotation.note
  activeAnnotationMenu.value = {
    top: targetRect.bottom - paperRect.top + 10 + paperRef.value.scrollTop,
    left: targetRect.left - paperRect.left + paperRef.value.scrollLeft,
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

function getParagraphElement(node: Node) {
  if (node instanceof HTMLElement) {
    return node.closest<HTMLElement>('.paper__paragraph')
  }

  return node.parentElement?.closest<HTMLElement>('.paper__paragraph') ?? null
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
    return [
      {
        text: paragraph.text,
        wordId: null,
        grammarId: null,
        sentenceId: null,
        focusId: null,
      },
    ]
  }

  const boundarySet = new Set<number>([paragraph.start, paragraph.end])

  for (const annotation of relatedAnnotations) {
    boundarySet.add(Math.max(annotation.start, paragraph.start))
    boundarySet.add(Math.min(annotation.end, paragraph.end))
  }

  const boundaries = [...boundarySet].sort((left, right) => left - right)
  const segments: Array<{
    text: string
    wordId: string | null
    grammarId: string | null
    sentenceId: string | null
    focusId: string | null
  }> = []

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]

    if (end <= start) {
      continue
    }

    const covered = relatedAnnotations.filter((annotation) => annotation.start <= start && annotation.end >= end)
    const word = covered.find((annotation) => annotation.type === 'word')
    const grammar = covered.find((annotation) => annotation.type === 'grammar')
    const sentence = covered.find((annotation) => annotation.type === 'sentence')
    const focus = covered.find((annotation) => annotation.type === 'focus')

    segments.push({
      text: paragraph.text.slice(start - paragraph.start, end - paragraph.start),
      wordId: word?.id ?? null,
      grammarId: grammar?.id ?? null,
      sentenceId: sentence?.id ?? null,
      focusId: focus?.id ?? null,
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

    <section
      ref="paperRef"
      class="paper panel"
      @scroll="handleScroll"
      @mousedown="handlePaperMouseDown"
      @mouseup="handlePaperMouseUp"
    >
      <div class="paper__texture"></div>

      <div
        v-if="selectionDraft"
        class="selection-toolbar"
        :style="{ top: `${selectionDraft.top}px`, left: `${selectionDraft.left}px` }"
        @mousedown.stop
      >
        <button
          v-for="tool in tools"
          :key="tool.type"
          class="selection-toolbar__button"
          :class="`selection-toolbar__button--${tool.color}`"
          type="button"
          @click="createAnnotation(tool.type)"
        >
          {{ tool.title }}
        </button>
      </div>

      <div
        v-if="activeAnnotation && activeAnnotationMenu"
        class="annotation-editor"
        :style="{ top: `${activeAnnotationMenu.top}px`, left: `${activeAnnotationMenu.left}px` }"
        @mousedown.stop
      >
        <strong class="annotation-editor__title">{{ activeAnnotation.text }}</strong>
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

      <article v-if="!isEmpty" ref="contentRef" class="paper__content">
        <p
          v-for="paragraph in paragraphSegments"
          :key="paragraph.id"
          class="paper__paragraph"
          :data-paragraph-id="paragraph.id"
        >
          <AnnotationSegment
            v-for="(segment, index) in paragraph.segments"
            :key="`${paragraph.id}-${index}`"
            :text="segment.text"
            :word-id="segment.wordId"
            :grammar-id="segment.grammarId"
            :sentence-id="segment.sentenceId"
            :focus-id="segment.focusId"
            @annotation-click="handleAnnotationClick"
          />
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
