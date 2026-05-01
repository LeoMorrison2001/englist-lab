import type { StoredAnnotation } from '../types/ui'

export function hasOverlappingRange(annotations: StoredAnnotation[], start: number, end: number) {
  return annotations.some((annotation) => start < annotation.end && end > annotation.start)
}
