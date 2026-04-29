import type { Component } from 'vue'

export type NavItem = {
  label: string
  icon: Component
  active?: boolean
}

export type ArticleItem = {
  title: string
  date: string
  size: string
  selected?: boolean
}

export type ToolItem = {
  title: string
  subtitle: string
  color: string
}

export type AnnotationItem = {
  type: string
  excerpt: string
  note: string
  color: string
}
