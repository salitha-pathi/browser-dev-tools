import type * as Monaco from 'monaco-editor'
import type { JsonChange, SourceRange } from '../diff/types'

export type MonacoEditor = Monaco.editor.IStandaloneCodeEditor
export type DecorationsCollection = Monaco.editor.IEditorDecorationsCollection

const ADDED_CLASS = 'json-diff-added'
const MODIFIED_CLASS = 'json-diff-modified'

/** Convert 0-based SourceRange to a Monaco Range (1-based). */
function toMonacoRange(monaco: typeof Monaco, range: SourceRange): Monaco.Range {
  return new monaco.Range(
    range.startLine + 1,
    range.startColumn + 1,
    range.endLine + 1,
    range.endColumn + 1,
  )
}

function makeDecoration(
  monaco: typeof Monaco,
  range: SourceRange,
  className: string,
): Monaco.editor.IModelDeltaDecoration {
  return {
    range: toMonacoRange(monaco, range),
    options: {
      inlineClassName: className,
    },
  }
}

/**
 * Rebuild decorations for both editors from the normalized change list.
 * Pass the existing collections so Monaco can diff-update them efficiently.
 */
export function applyDiffDecorations(
  monaco: typeof Monaco,
  _originalEditor: MonacoEditor,
  _modifiedEditor: MonacoEditor,
  originalCollection: DecorationsCollection,
  modifiedCollection: DecorationsCollection,
  changes: JsonChange[],
): void {
  const originalDecorations: Monaco.editor.IModelDeltaDecoration[] = []
  const modifiedDecorations: Monaco.editor.IModelDeltaDecoration[] = []

  for (const change of changes) {
    if (change.operation === 'add' && change.modified?.property) {
      modifiedDecorations.push(makeDecoration(monaco, change.modified.property, ADDED_CLASS))
    } else if (change.operation === 'remove' && change.original?.property) {
      originalDecorations.push(makeDecoration(monaco, change.original.property, ADDED_CLASS))
    } else if (change.operation === 'replace') {
      if (change.original?.value) {
        originalDecorations.push(makeDecoration(monaco, change.original.value, MODIFIED_CLASS))
      }
      if (change.modified?.value) {
        modifiedDecorations.push(makeDecoration(monaco, change.modified.value, MODIFIED_CLASS))
      }
    }
  }

  originalCollection.set(originalDecorations)
  modifiedCollection.set(modifiedDecorations)
}

/** Clear all diff decorations from both editors. */
export function clearDiffDecorations(
  originalCollection: DecorationsCollection,
  modifiedCollection: DecorationsCollection,
): void {
  originalCollection.clear()
  modifiedCollection.clear()
}
