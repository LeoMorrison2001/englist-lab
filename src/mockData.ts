import { BookOpenText, GraduationCap, LibraryBig, NotebookPen, Settings2 } from 'lucide-vue-next'

import type { AnnotationGroup, NavItem, ToolItem } from './types/ui'

export const navItems: NavItem[] = [
  { label: '阅读', icon: BookOpenText, active: true },
  { label: '笔记', icon: NotebookPen },
  { label: '复习', icon: GraduationCap },
  { label: '词库', icon: LibraryBig },
  { label: '设置', icon: Settings2 },
]

export const annotationTools: ToolItem[] = [
  { type: 'word', title: '单词', subtitle: '蓝色高亮', color: 'blue' },
  { type: 'grammar', title: '语法', subtitle: '橙色波浪线', color: 'orange' },
  { type: 'sentence', title: '句子', subtitle: '黄色下划线', color: 'yellow' },
  { type: 'focus', title: '重点', subtitle: '红色强调', color: 'red' },
]

export const annotationGroupTemplates: Omit<AnnotationGroup, 'items'>[] = [
  { type: 'word', title: '单词', color: 'blue' },
  { type: 'grammar', title: '语法', color: 'orange' },
  { type: 'sentence', title: '句子', color: 'yellow' },
  { type: 'focus', title: '重点', color: 'red' },
]
