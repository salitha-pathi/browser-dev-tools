import type { Pointers } from 'json-source-map'
import type { JsonSourceLocation, SourceRange } from '../diff/types'

function toRange(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
): SourceRange {
  return { startLine, startColumn, endLine, endColumn }
}

/**
 * Resolve a JSON Pointer path to its source location in the pointer map.
 * Coordinates are 0-based (json-source-map convention).
 */
export function resolveJsonPath(pointers: Pointers, path: string): JsonSourceLocation | null {
  const mapping = pointers[path]
  if (!mapping) return null

  const value = toRange(
    mapping.value.line,
    mapping.value.column,
    mapping.valueEnd.line,
    mapping.valueEnd.column,
  )

  if (!mapping.key || !mapping.keyEnd) {
    // Array item or root — no key
    return { value }
  }

  const key = toRange(
    mapping.key.line,
    mapping.key.column,
    mapping.keyEnd.line,
    mapping.keyEnd.column,
  )

  // Property spans from key start to value end
  const property = toRange(
    mapping.key.line,
    mapping.key.column,
    mapping.valueEnd.line,
    mapping.valueEnd.column,
  )

  return { key, value, property }
}
