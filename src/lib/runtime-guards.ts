export const MIN_DESKTOP_WIDTH = 1500
export const MIN_DESKTOP_HEIGHT = 1000

type DeviceDescriptor = {
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
}

type WindowSizeDescriptor = {
  innerWidth?: number
  innerHeight?: number
  outerWidth?: number
  outerHeight?: number
}

export function detectUnsupportedDevice(device: DeviceDescriptor = {}) {
  const userAgent = device.userAgent || ''
  const platform = device.platform || ''
  const maxTouchPoints = device.maxTouchPoints || 0

  const isIPhone = /iPhone/i.test(userAgent)
  const isIPad = /iPad/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
  const isAndroid = /Android/i.test(userAgent)
  const isMobileKeyword = /Mobile|Phone|Windows Phone/i.test(userAgent)
  const isTabletKeyword = /Tablet|PlayBook|Silk/i.test(userAgent)

  if (isIPhone || isIPad || isTabletKeyword) {
    return true
  }

  if (isAndroid || isMobileKeyword) {
    return true
  }

  return false
}

export function getWindowSize(windowLike?: WindowSizeDescriptor) {
  if (!windowLike) {
    return {
      width: MIN_DESKTOP_WIDTH,
      height: MIN_DESKTOP_HEIGHT,
    }
  }

  const width = Math.max(windowLike.outerWidth || 0, windowLike.innerWidth || 0)
  const height = Math.max(windowLike.outerHeight || 0, windowLike.innerHeight || 0)

  return { width, height }
}

export function isViewportTooSmall(windowLike?: WindowSizeDescriptor) {
  const { width, height } = getWindowSize(windowLike)
  return width < MIN_DESKTOP_WIDTH || height < MIN_DESKTOP_HEIGHT
}
