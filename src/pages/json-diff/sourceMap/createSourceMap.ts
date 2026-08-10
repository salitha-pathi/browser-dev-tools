import * as jsonSourceMap from 'json-source-map'
import type { Pointers } from 'json-source-map'

export interface SourceMapResult {
  data: unknown
  pointers: Pointers
}

/**
 * Parse JSON and return both the value and the pointer map.
 * Returns null on parse failure.
 */
export function createSourceMap(jsonText: string): SourceMapResult | null {
  try {
    return jsonSourceMap.parse(jsonText)
  } catch {
    return null
  }
}
