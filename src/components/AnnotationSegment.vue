<script setup lang="ts">
defineProps<{
  text: string
  wordId: string | null
  grammarId: string | null
  sentenceId: string | null
  focusId: string | null
}>()

const emit = defineEmits<{
  annotationClick: [annotationId: string, event: MouseEvent]
}>()

function trigger(annotationId: string | null, event: MouseEvent) {
  if (!annotationId) {
    return
  }

  emit('annotationClick', annotationId, event)
}
</script>

<template>
  <span
    v-if="grammarId"
    class="paper__annotated paper__annotated--grammar"
    :data-annotation-id="grammarId"
    @click.stop="!wordId && !sentenceId && !focusId && trigger(grammarId, $event)"
  >
    <span
      v-if="sentenceId"
      class="paper__annotated paper__annotated--sentence"
      :data-annotation-id="sentenceId"
      @click.stop="!wordId && !focusId && trigger(sentenceId, $event)"
    >
      <span
        v-if="focusId"
        class="paper__annotated paper__annotated--focus"
        :data-annotation-id="focusId"
        @click.stop="!wordId && trigger(focusId, $event)"
      >
        <span
          v-if="wordId"
          class="paper__annotated paper__annotated--word"
          :data-annotation-id="wordId"
          @click.stop="trigger(wordId, $event)"
        >
          {{ text }}
        </span>
        <template v-else>{{ text }}</template>
      </span>
      <span
        v-else-if="wordId"
        class="paper__annotated paper__annotated--word"
        :data-annotation-id="wordId"
        @click.stop="trigger(wordId, $event)"
      >
        {{ text }}
      </span>
      <template v-else>{{ text }}</template>
    </span>
    <span
      v-else-if="focusId"
      class="paper__annotated paper__annotated--focus"
      :data-annotation-id="focusId"
      @click.stop="!wordId && trigger(focusId, $event)"
    >
      <span
        v-if="wordId"
        class="paper__annotated paper__annotated--word"
        :data-annotation-id="wordId"
        @click.stop="trigger(wordId, $event)"
      >
        {{ text }}
      </span>
      <template v-else>{{ text }}</template>
    </span>
    <span
      v-else-if="wordId"
      class="paper__annotated paper__annotated--word"
      :data-annotation-id="wordId"
      @click.stop="trigger(wordId, $event)"
    >
      {{ text }}
    </span>
    <template v-else>{{ text }}</template>
  </span>
  <span
    v-else-if="sentenceId"
    class="paper__annotated paper__annotated--sentence"
    :data-annotation-id="sentenceId"
    @click.stop="!wordId && !focusId && trigger(sentenceId, $event)"
  >
    <span
      v-if="focusId"
      class="paper__annotated paper__annotated--focus"
      :data-annotation-id="focusId"
      @click.stop="!wordId && trigger(focusId, $event)"
    >
      <span
        v-if="wordId"
        class="paper__annotated paper__annotated--word"
        :data-annotation-id="wordId"
        @click.stop="trigger(wordId, $event)"
      >
        {{ text }}
      </span>
      <template v-else>{{ text }}</template>
    </span>
    <span
      v-else-if="wordId"
      class="paper__annotated paper__annotated--word"
      :data-annotation-id="wordId"
      @click.stop="trigger(wordId, $event)"
    >
      {{ text }}
    </span>
    <template v-else>{{ text }}</template>
  </span>
  <span
    v-else-if="focusId"
    class="paper__annotated paper__annotated--focus"
    :data-annotation-id="focusId"
    @click.stop="!wordId && trigger(focusId, $event)"
  >
    <span
      v-if="wordId"
      class="paper__annotated paper__annotated--word"
      :data-annotation-id="wordId"
      @click.stop="trigger(wordId, $event)"
    >
      {{ text }}
    </span>
    <template v-else>{{ text }}</template>
  </span>
  <span
    v-else-if="wordId"
    class="paper__annotated paper__annotated--word"
    :data-annotation-id="wordId"
    @click.stop="trigger(wordId, $event)"
  >
    {{ text }}
  </span>
  <template v-else>{{ text }}</template>
</template>
