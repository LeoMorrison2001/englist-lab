<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { hasOverlappingRange } from '../lib/annotations'
import AnnotationSegment from './AnnotationSegment.vue'
import type { AnnotationType, ReaderParagraph, StoredAnnotation, ToolItem } from '../types/ui'

type SearchMatch = {
  id: string
  paragraphId: string
  start: number
  end: number
}

const props = defineProps<{
  articleId: number | null
  title: string
  wordCount: number
  saveLabel: string
  tools: ToolItem[]
  paragraphs: ReaderParagraph[]
  annotations: StoredAnnotation[]
  readingProgress: number
  focusRequest: { annotationId: string; token: number } | null
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
const pulsingAnnotationId = ref<string | null>(null)
const searchQuery = ref('')
const activeSearchIndex = ref(0)

let pulseTimer: ReturnType<typeof setTimeout> | null = null
let focusMenuTimer: ReturnType<typeof setTimeout> | null = null
let focusScrollTimer: ReturnType<typeof setTimeout> | null = null
let searchFocusTimer: ReturnType<typeof setTimeout> | null = null

const searchMatches = computed<SearchMatch[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return []
  }

  const matches: SearchMatch[] = []

  for (const paragraph of props.paragraphs) {
    const haystack = paragraph.text.toLowerCase()
    let cursor = 0
    let index = haystack.indexOf(query, cursor)
    let count = 0

    while (index !== -1) {
      matches.push({
        id: `${paragraph.id}-search-${count}`,
        paragraphId: paragraph.id,
        start: paragraph.start + index,
        end: paragraph.start + index + query.length,
      })

      cursor = index + query.length
      count += 1
      index = haystack.indexOf(query, cursor)
    }
  }

  return matches
})

const activeSearchMatchId = computed(() => {
  if (searchMatches.value.length === 0) {
    return null
  }

  return searchMatches.value[activeSearchIndex.value]?.id ?? searchMatches.value[0].id
})

const paragraphSegments = computed(() => {
  return props.paragraphs.map((paragraph) => ({
    ...paragraph,
    segments: buildSegments(paragraph, props.annotations, searchMatches.value, activeSearchMatchId.value),
  }))
})

const activeAnnotation = computed(() => {
  if (!activeAnnotationId.value) {
    return null
  }

  return props.annotations.find((annotation) => annotation.id === activeAnnotationId.value) ?? null
})

const searchSummary = computed(() => {
  if (!searchQuery.value.trim()) {
    return ''
  }

  if (searchMatches.value.length === 0) {
    return '未找到'
  }

  return `${activeSearchIndex.value + 1} / ${searchMatches.value.length}`
})

watch(
  () => [props.articleId, props.paragraphs.length],
  async () => {
    await nextTick()
    restoreProgress()
    clearSelection()
    closeAnnotationMenu()
    searchQuery.value = ''
    activeSearchIndex.value = 0
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

watch(
  () => props.focusRequest?.token,
  async () => {
    if (!props.focusRequest?.annotationId) {
      return
    }

    await nextTick()
    focusAnnotationById(props.focusRequest.annotationId)
  },
)

watch(searchQuery, async () => {
  activeSearchIndex.value = 0

  if (!searchQuery.value.trim()) {
    return
  }

  await nextTick()
  focusActiveSearchMatch()
})

watch(activeSearchIndex, async () => {
  if (!searchQuery.value.trim()) {
    return
  }

  await nextTick()
  focusActiveSearchMatch()
})

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

  if (hasOverlappingRange(sameTypeAnnotations, selectionDraft.value.start, selectionDraft.value.end)) {
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
  openAnnotationMenu(annotationId, event.currentTarget as HTMLElement)
}

function openAnnotationMenu(annotationId: string, target: HTMLElement) {
  const annotation = props.annotations.find((item) => item.id === annotationId)
  const paperRect = paperRef.value?.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

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

function focusAnnotationById(annotationId: string) {
  if (!paperRef.value) {
    return
  }

  const target = paperRef.value.querySelector<HTMLElement>(`[data-annotation-id="${annotationId}"]`)

  if (!target) {
    return
  }

  const anchor = target.closest<HTMLElement>('.paper__paragraph') ?? target
  const paperRect = paperRef.value.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()
  const targetTop = Math.max(
    paperRef.value.scrollTop + (anchorRect.top - paperRect.top) - paperRef.value.clientHeight * 0.32,
    0,
  )

  isRestoringScroll.value = true

  paperRef.value.scrollTo({
    top: targetTop,
    behavior: 'smooth',
  })

  pulsingAnnotationId.value = annotationId

  if (pulseTimer) {
    clearTimeout(pulseTimer)
  }

  pulseTimer = setTimeout(() => {
    if (pulsingAnnotationId.value === annotationId) {
      pulsingAnnotationId.value = null
    }
  }, 1800)

  if (focusMenuTimer) {
    clearTimeout(focusMenuTimer)
  }

  if (focusScrollTimer) {
    clearTimeout(focusScrollTimer)
  }

  focusScrollTimer = setTimeout(() => {
    isRestoringScroll.value = false
  }, 520)

  focusMenuTimer = setTimeout(() => {
    const refreshedTarget = paperRef.value?.querySelector<HTMLElement>(`[data-annotation-id="${annotationId}"]`)

    if (refreshedTarget) {
      openAnnotationMenu(annotationId, refreshedTarget)
    }
  }, 320)
}

function focusActiveSearchMatch() {
  if (!paperRef.value || !activeSearchMatchId.value) {
    return
  }

  const target = paperRef.value.querySelector<HTMLElement>(`[data-search-match-id="${activeSearchMatchId.value}"]`)

  if (!target) {
    return
  }

  const anchor = target.closest<HTMLElement>('.paper__paragraph') ?? target

  if (searchFocusTimer) {
    clearTimeout(searchFocusTimer)
  }

  isRestoringScroll.value = true
  anchor.scrollIntoView({
    block: 'center',
    behavior: 'smooth',
  })

  searchFocusTimer = setTimeout(() => {
    isRestoringScroll.value = false
  }, 420)
}

function moveSearch(delta: number) {
  if (searchMatches.value.length === 0) {
    return
  }

  activeSearchIndex.value =
    (activeSearchIndex.value + delta + searchMatches.value.length) % searchMatches.value.length
}

function buildSegments(
  paragraph: ReaderParagraph,
  annotations: StoredAnnotation[],
  matches: SearchMatch[],
  activeSearchId: string | null,
) {
  const relatedAnnotations = annotations
    .filter((annotation) => annotation.start < paragraph.end && annotation.end > paragraph.start)
    .sort((left, right) => left.start - right.start)
  const relatedMatches = matches
    .filter((match) => match.start < paragraph.end && match.end > paragraph.start)
    .sort((left, right) => left.start - right.start)

  if (relatedAnnotations.length === 0 && relatedMatches.length === 0) {
    return [
      {
        text: paragraph.text,
        wordId: null,
        grammarId: null,
        sentenceId: null,
        focusId: null,
        searchId: null,
        searchActive: false,
      },
    ]
  }

  const boundarySet = new Set<number>([paragraph.start, paragraph.end])

  for (const annotation of relatedAnnotations) {
    boundarySet.add(Math.max(annotation.start, paragraph.start))
    boundarySet.add(Math.min(annotation.end, paragraph.end))
  }

  for (const match of relatedMatches) {
    boundarySet.add(Math.max(match.start, paragraph.start))
    boundarySet.add(Math.min(match.end, paragraph.end))
  }

  const boundaries = [...boundarySet].sort((left, right) => left - right)
  const segments: Array<{
    text: string
    wordId: string | null
    grammarId: string | null
    sentenceId: string | null
    focusId: string | null
    searchId: string | null
    searchActive: boolean
  }> = []

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const end = boundaries[index + 1]

    if (end <= start) {
      continue
    }

    const coveredAnnotations = relatedAnnotations.filter((annotation) => annotation.start <= start && annotation.end >= end)
    const coveredMatch = relatedMatches.find((match) => match.start <= start && match.end >= end)

    segments.push({
      text: paragraph.text.slice(start - paragraph.start, end - paragraph.start),
      wordId: coveredAnnotations.find((annotation) => annotation.type === 'word')?.id ?? null,
      grammarId: coveredAnnotations.find((annotation) => annotation.type === 'grammar')?.id ?? null,
      sentenceId: coveredAnnotations.find((annotation) => annotation.type === 'sentence')?.id ?? null,
      focusId: coveredAnnotations.find((annotation) => annotation.type === 'focus')?.id ?? null,
      searchId: coveredMatch?.id ?? null,
      searchActive: coveredMatch?.id === activeSearchId,
    })
  }

  return segments
}

</script>

<template>
  <main class="reader-stage">
    <header class="reader-toolbar panel">
      <div class="reader-toolbar__title">
        <h2>{{ title }}</h2>
      </div>
      <div class="reader-searchbar">
        <input
          v-model="searchQuery"
          class="reader-searchbar__input"
          type="text"
          placeholder="搜索当前文章"
        />
        <span v-if="searchQuery.trim()" class="reader-searchbar__count">{{ searchSummary }}</span>
        <button
          class="reader-searchbar__button"
          type="button"
          :disabled="searchMatches.length === 0"
          @click="moveSearch(-1)"
        >
          上一个
        </button>
        <button
          class="reader-searchbar__button"
          type="button"
          :disabled="searchMatches.length === 0"
          @click="moveSearch(1)"
        >
          下一个
        </button>
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
            :class="{
              'paper__annotated--pulse':
                pulsingAnnotationId &&
                [segment.wordId, segment.grammarId, segment.sentenceId, segment.focusId].includes(pulsingAnnotationId),
            }"
            :text="segment.text"
            :word-id="segment.wordId"
            :grammar-id="segment.grammarId"
            :sentence-id="segment.sentenceId"
            :focus-id="segment.focusId"
            :search-id="segment.searchId"
            :search-active="segment.searchActive"
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
