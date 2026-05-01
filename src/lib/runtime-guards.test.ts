import { describe, expect, it } from 'vitest'

import {
  MIN_DESKTOP_HEIGHT,
  MIN_DESKTOP_WIDTH,
  detectUnsupportedDevice,
  getWindowSize,
  isViewportTooSmall,
} from './runtime-guards'

describe('detectUnsupportedDevice', () => {
  it('blocks iphone devices', () => {
    expect(
      detectUnsupportedDevice({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      }),
    ).toBe(true)
  })

  it('blocks ipad style touch devices', () => {
    expect(
      detectUnsupportedDevice({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    ).toBe(true)
  })

  it('allows normal desktop browsers', () => {
    expect(
      detectUnsupportedDevice({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/135.0.0.0 Safari/537.36',
        platform: 'Win32',
        maxTouchPoints: 0,
      }),
    ).toBe(false)
  })
})

describe('getWindowSize', () => {
  it('prefers the larger available browser dimensions', () => {
    expect(
      getWindowSize({
        innerWidth: 1480,
        innerHeight: 960,
        outerWidth: 1520,
        outerHeight: 1010,
      }),
    ).toEqual({
      width: 1520,
      height: 1010,
    })
  })

  it('falls back to the desktop minimum when no window exists', () => {
    expect(getWindowSize()).toEqual({
      width: MIN_DESKTOP_WIDTH,
      height: MIN_DESKTOP_HEIGHT,
    })
  })
})

describe('isViewportTooSmall', () => {
  it('blocks windows narrower than the minimum width', () => {
    expect(
      isViewportTooSmall({
        outerWidth: MIN_DESKTOP_WIDTH - 1,
        outerHeight: MIN_DESKTOP_HEIGHT + 100,
      }),
    ).toBe(true)
  })

  it('blocks windows shorter than the minimum height', () => {
    expect(
      isViewportTooSmall({
        outerWidth: MIN_DESKTOP_WIDTH + 100,
        outerHeight: MIN_DESKTOP_HEIGHT - 1,
      }),
    ).toBe(true)
  })

  it('allows windows that meet both minimums', () => {
    expect(
      isViewportTooSmall({
        outerWidth: MIN_DESKTOP_WIDTH,
        outerHeight: MIN_DESKTOP_HEIGHT,
      }),
    ).toBe(false)
  })
})
