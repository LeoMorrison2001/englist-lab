<script setup lang="ts">
import type { NavItem } from '../types/ui'

defineProps<{
  items: NavItem[]
}>()
</script>

<template>
  <aside class="left-rail">
    <div class="brand-mark">
      <div class="brand-mark__icon">
        <img src="/logo.png" alt="EnglishLab logo" />
      </div>
    </div>
    <nav class="left-rail__nav" aria-label="主导航">
      <button
        v-for="item in items"
        :key="item.label"
        class="rail-button"
        :class="{ 'rail-button--active': item.active }"
        type="button"
      >
        <span class="rail-button__icon">
          <component :is="item.icon" />
        </span>
        <span class="rail-button__label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>
