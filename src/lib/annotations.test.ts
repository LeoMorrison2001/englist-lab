import { describe, expect, it } from 'vitest'

import { hasOverlappingRange } from './annotations'

describe('hasOverlappingRange', () => {
  const annotations = [
    {
      id: 'a1',
      type: 'word' as const,
      text: 'hello',
      context: 'hello world',
      note: '',
      start: 10,
      end: 15,
      color: 'blue' as const,
      createdAt: '2026-05-01T00:00:00.000Z',
    },
  ]

  it('returns true for overlapping selections', () => {
    expect(hasOverlappingRange(annotations, 12, 14)).toBe(true)
  })

  it('returns false for adjacent selections', () => {
    expect(hasOverlappingRange(annotations, 15, 20)).toBe(false)
  })

  it('returns false for fully separate selections', () => {
    expect(hasOverlappingRange(annotations, 0, 5)).toBe(false)
  })
})
