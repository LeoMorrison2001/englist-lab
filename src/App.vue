<script setup lang="ts">
import type { Component } from 'vue'
import {
  BookOpenText,
  NotebookPen,
  GraduationCap,
  LibraryBig,
  Settings2,
} from 'lucide-vue-next'

type NavItem = {
  label: string
  icon: Component
  active?: boolean
}

type ArticleItem = {
  title: string
  date: string
  size: string
  selected?: boolean
}

type ToolItem = {
  title: string
  subtitle: string
  color: string
}

type AnnotationItem = {
  type: string
  excerpt: string
  note: string
  color: string
}

const navItems: NavItem[] = [
  { label: '阅读', icon: BookOpenText, active: true },
  { label: '笔记', icon: NotebookPen },
  { label: '复习', icon: GraduationCap },
  { label: '词库', icon: LibraryBig },
  { label: '设置', icon: Settings2 },
]

const articles: ArticleItem[] = [
  { title: 'The Value of Time.txt', date: '2026-04-29', size: '12.4 KB', selected: true },
  { title: 'A Walk in the Woods.txt', date: '2026-04-27', size: '9.8 KB' },
  { title: 'How to Build Good Habits.txt', date: '2026-04-25', size: '11.2 KB' },
  { title: 'The Power of Positivity.txt', date: '2026-04-22', size: '10.1 KB' },
  { title: 'Why We Sleep.txt', date: '2026-04-18', size: '7.3 KB' },
  { title: 'The Future of Technology and Human Learning.txt', date: '2026-04-16', size: '13.6 KB' },
  { title: 'Success Is a Choice.txt', date: '2026-04-12', size: '9.2 KB' },
  { title: 'How Small Actions Create Big Results.txt', date: '2026-04-10', size: '10.8 KB' },
  { title: 'The Art of Staying Focused.txt', date: '2026-04-08', size: '8.9 KB' },
  { title: 'Why Reading Changes the Brain.txt', date: '2026-04-05', size: '12.1 KB' },
  { title: 'Learning English Through Daily Reflection.txt', date: '2026-04-02', size: '11.6 KB' },
  { title: 'The Hidden Power of Consistency.txt', date: '2026-03-29', size: '9.5 KB' },
]

const toolItems: ToolItem[] = [
  { title: '单词', subtitle: '标注生词', color: 'blue' },
  { title: '语法', subtitle: '标注语法', color: 'orange' },
  { title: '句子', subtitle: '长难句', color: 'yellow' },
  { title: '重点', subtitle: '重要内容', color: 'red' },
]

const annotationItems: AnnotationItem[] = [
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
  {
    type: '单词',
    excerpt: 'make the most of every moment',
    note: '充分利用每一刻',
    color: 'blue',
  },
  {
    type: '语法',
    excerpt: 'When we study with a plan',
    note: '时间状语从句',
    color: 'orange',
  },
  {
    type: '句子',
    excerpt: 'Rest is not the opposite of progress',
    note: '适合摘抄的表达句',
    color: 'yellow',
  },
  {
    type: '重点',
    excerpt: 'the wise use of time becomes a form of self-respect',
    note: '总结段核心观点',
    color: 'red',
  },
  {
    type: '单词',
    excerpt: 'quietly consume it',
    note: '悄然消耗掉它',
    color: 'blue',
  },
  {
    type: '语法',
    excerpt: 'what makes progress sustainable',
    note: 'what 引导宾语从句',
    color: 'orange',
  },
]

const paperParagraphs = [
  [
    'Time is the most valuable resource we possess. Once it is gone, it can never be retrieved.',
    'Unlike money or other materials, time is ',
    'non-renewable and irreplaceable',
    '.',
  ],
  [
    'Many people waste time on unimportant things, only to realize its value when it is too late. ',
    'Effective time management',
    ' is essential for achieving our goals and living a meaningful life.',
  ],
  [
    'By prioritizing tasks, avoiding procrastination, and staying focused, we can make the most of every moment. Remember, ',
    "it's not about how much time you have",
    ', but how you use it.',
  ],
  [
    'In the end, ',
    'a well-spent life is a collection of well-used time',
    '. Let’s value time, make the most of it, and create a better future for ourselves.',
  ],
  [
    'Time does not stop for anyone. Every day presents us with twenty-four hours, and how we choose to spend them shapes the quality of our lives. Some people use time with purpose, while others allow distractions to quietly consume it.',
  ],
  [
    'For students, good time management is especially important. It helps us balance learning, rest, and personal growth. When we study with a plan, even difficult goals begin to feel possible and steady progress becomes easier to see.',
  ],
  [
    'At the same time, using time well does not mean being busy every moment. It also means knowing when to pause, reflect, and recover. Rest is not the opposite of progress; in many cases, it is what makes progress sustainable.',
  ],
  [
    'If we learn to focus on what matters most, we can reduce anxiety and build confidence. Small, consistent actions often create better results than short bursts of effort followed by long periods of delay or frustration.',
  ],
  [
    'In the long run, the wise use of time becomes a form of self-respect. It shows that we value our future, our goals, and the opportunities placed before us. To waste time carelessly is to give away something we can never earn back.',
  ],
]
</script>

<template>
  <div class="app-shell">
    <aside class="left-rail">
      <div class="brand-mark">
        <div class="brand-mark__icon">
          <img src="/logo.png" alt="EnglishLab logo" />
        </div>
      </div>
      <nav class="left-rail__nav" aria-label="主导航">
        <button
          v-for="item in navItems"
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

    <aside class="library-panel panel">
      <button class="primary-action" type="button">+ 导入文章</button>

      <label class="library-search">
        <span class="library-search__icon"></span>
        <input type="text" placeholder="搜索文章标题" />
      </label>

      <section class="panel-section panel-section--grow library-section">
        <div class="panel-section__title">
          <h2>我的文章</h2>
          <span>(8)</span>
        </div>
        <div class="article-list">
          <button
            v-for="article in articles"
            :key="article.title"
            class="article-card"
            :class="{ 'article-card--selected': article.selected }"
            type="button"
          >
            <div class="article-card__top">
              <strong>{{ article.title }}</strong>
              <span class="article-card__dot"></span>
            </div>
            <div class="article-card__meta">
              <span>{{ article.date }}</span>
              <span>{{ article.size }}</span>
            </div>
          </button>
        </div>
      </section>
    </aside>

    <main class="reader-stage">
      <header class="reader-toolbar panel">
        <div class="reader-toolbar__title">
          <h2>The Value of Time.txt</h2>
        </div>
      </header>

      <section class="paper panel">
        <div class="paper__texture"></div>
        <article class="paper__content">
          <p class="paper__paragraph">
            {{ paperParagraphs[0][0] }}{{ paperParagraphs[0][1] }}{{ paperParagraphs[0][2]
            }}{{ paperParagraphs[0][3] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[1][0] }}{{ paperParagraphs[1][1] }}{{ paperParagraphs[1][2] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[2][0] }}{{ paperParagraphs[2][1] }}{{ paperParagraphs[2][2] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[3][0] }}{{ paperParagraphs[3][1] }}{{ paperParagraphs[3][2] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[4][0] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[5][0] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[6][0] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[7][0] }}
          </p>
          <p class="paper__paragraph">
            {{ paperParagraphs[8][0] }}
          </p>
        </article>
      </section>

      <footer class="reader-footer panel">
        <div class="reader-footer__meta">字数: 328 词</div>
        <div class="reader-footer__status">
          <span class="dot dot--green"></span>
          <span>已保存</span>
        </div>
      </footer>
    </main>

    <aside class="inspector-panel panel">
      <header class="inspector-panel__header">
        <div>
          <h2>标注工具</h2>
        </div>
      </header>

      <section class="panel-section">
        <div class="panel-section__title">
          <h3>画笔工具</h3>
        </div>
        <div class="tool-grid">
          <button
            v-for="tool in toolItems"
            :key="tool.title"
            class="tool-card"
            :class="`tool-card--${tool.color}`"
            type="button"
          >
            <strong>{{ tool.title }}</strong>
            <span>{{ tool.subtitle }}</span>
          </button>
        </div>
      </section>

      <section class="panel-section panel-section--grow annotation-section">
        <div class="panel-section__title">
          <h3>标注列表</h3>
        </div>
        <div class="annotation-list">
          <article
            v-for="(annotation, index) in annotationItems"
            :key="`${annotation.type}-${index}`"
            class="annotation-card"
            :class="`annotation-card--${annotation.color}`"
          >
            <div class="annotation-card__meta">
              <span class="annotation-card__type">
                <span class="annotation-card__type-dot"></span>
                {{ annotation.type }}
              </span>
              <span>{{ index + 1 }}</span>
            </div>
            <strong>{{ annotation.excerpt }}</strong>
            <p>{{ annotation.note }}</p>
          </article>
        </div>
      </section>
    </aside>
  </div>
</template>
