import { parseJson } from '@/utils/json'
import { normalizePatch } from './normalizePatch'
import { resolveJsonPath } from '../sourceMap/resolveJsonPath'
import { createSourceMap } from '../sourceMap/createSourceMap'
import type { JsonChange } from './types'

export interface JsonDiffResult {
  changes: JsonChange[]
}

/**
 * Compute the full diff between two JSON strings.
 * Returns null when either string is not valid JSON.
 */
export function createJsonDiff(originalText: string, modifiedText: string): JsonDiffResult | null {
  const originalParsed = parseJson(originalText)
  const modifiedParsed = parseJson(modifiedText)

  if (originalParsed.error !== undefined || modifiedParsed.error !== undefined) {
    return null
  }

  const originalMap = createSourceMap(originalText)
  const modifiedMap = createSourceMap(modifiedText)

  if (!originalMap || !modifiedMap) return null

  const rawChanges = normalizePatch(originalParsed.data, modifiedParsed.data)

  const changes: JsonChange[] = rawChanges.map((change) => {
    const original =
      change.operation !== 'add' ? resolveJsonPath(originalMap.pointers, change.path) : undefined

    const modified =
      change.operation !== 'remove' ? resolveJsonPath(modifiedMap.pointers, change.path) : undefined

    return { ...change, original: original ?? undefined, modified: modified ?? undefined }
  })

  return { changes }
}
