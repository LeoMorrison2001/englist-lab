import { BookOpenText, GraduationCap, LibraryBig, NotebookPen, Settings2 } from 'lucide-vue-next'

import type { NavItem, ToolItem } from './types/ui'

export const navItems: NavItem[] = [
  { label: '阅读', icon: BookOpenText, active: true },
  { label: '笔记', icon: NotebookPen },
  { label: '复习', icon: GraduationCap },
  { label: '词库', icon: LibraryBig },
  { label: '设置', icon: Settings2 },
]

export const toolItems: ToolItem[] = [
  { title: '单词', subtitle: '选中文本后添加标注', color: 'blue' },
  { title: '语法', subtitle: '下一步开发', color: 'orange' },
  { title: '句子', subtitle: '下一步开发', color: 'yellow' },
  { title: '重点', subtitle: '下一步开发', color: 'red' },
]
