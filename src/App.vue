<script setup lang="ts">
import InspectorPanel from './components/InspectorPanel.vue'
import LibraryPanel from './components/LibraryPanel.vue'
import ReaderWorkspace from './components/ReaderWorkspace.vue'
import SideNav from './components/SideNav.vue'
import { annotationItems, articles, navItems, paperParagraphs, toolItems } from './mockData'
</script>

<template>
  <div class="app-shell">
    <SideNav :items="navItems" />
    <LibraryPanel :articles="articles" />
    <ReaderWorkspace
      title="The Value of Time.txt"
      :word-count="328"
      save-label="已保存"
      :paragraphs="paperParagraphs"
    />
    <InspectorPanel :tools="toolItems" :annotations="annotationItems" />
  </div>
</template>
