import { compare, type Operation } from 'fast-json-patch'
import type { JsonChange } from './types'

/** Convert fast-json-patch operations to our normalized format */
export function normalizePatch(original: unknown, modified: unknown): JsonChange[] {
  const ops: Operation[] = compare(original as object, modified as object)

  return ops.flatMap((op): JsonChange[] => {
    if (op.op === 'add') {
      return [
        {
          operation: 'add',
          path: op.path,
          newValue: op.value,
        },
      ]
    }
    if (op.op === 'remove') {
      return [
        {
          operation: 'remove',
          path: op.path,
        },
      ]
    }
    if (op.op === 'replace') {
      return [
        {
          operation: 'replace',
          path: op.path,
          newValue: op.value,
        },
      ]
    }
    // move / copy / test are not used for display
    return []
  })
}
