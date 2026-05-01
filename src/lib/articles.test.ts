import { describe, expect, it } from 'vitest'

import { createUniqueArticleTitle } from './articles'

describe('createUniqueArticleTitle', () => {
  it('returns the original title when it is unique', () => {
    expect(createUniqueArticleTitle('hello.txt', [{ title: 'world.txt' }])).toBe('hello.txt')
  })

  it('appends an incrementing suffix when the title already exists', () => {
    expect(
      createUniqueArticleTitle('hello.txt', [
        { title: 'hello.txt' },
        { title: 'hello (2).txt' },
      ]),
    ).toBe('hello (3).txt')
  })

  it('keeps files without an extension working', () => {
    expect(
      createUniqueArticleTitle('reading-note', [
        { title: 'reading-note' },
        { title: 'reading-note (2)' },
      ]),
    ).toBe('reading-note (3)')
  })
})
