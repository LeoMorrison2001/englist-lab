import { BookOpenText, GraduationCap, LibraryBig, NotebookPen, Settings2 } from 'lucide-vue-next'

import type { AnnotationItem, NavItem, ToolItem } from './types/ui'

export const navItems: NavItem[] = [
  { label: '阅读', icon: BookOpenText, active: true },
  { label: '笔记', icon: NotebookPen },
  { label: '复习', icon: GraduationCap },
  { label: '词库', icon: LibraryBig },
  { label: '设置', icon: Settings2 },
]

export const toolItems: ToolItem[] = [
  { title: '单词', subtitle: '标注生词', color: 'blue' },
  { title: '语法', subtitle: '标注语法', color: 'orange' },
  { title: '句子', subtitle: '长难句', color: 'yellow' },
  { title: '重点', subtitle: '重要内容', color: 'red' },
]

export const annotationItems: AnnotationItem[] = [
  {
    type: '单词',
    excerpt: 'non-renewable and irreplaceable',
    note: '不可再生的；不可替代的',
    color: 'blue',
  },
  {
    type: '语法',
    excerpt: 'Effective time management',
    note: '名词短语作主语',
    color: 'orange',
  },
  {
    type: '句子',
    excerpt: "it's not about how much time you have",
    note: '强调句型，可做写作素材',
    color: 'yellow',
  },
  {
    type: '重点',
    excerpt: 'a well-spent life is a collection of well-used time',
    note: '主题句；总结全文',
    color: 'red',
  },
]
