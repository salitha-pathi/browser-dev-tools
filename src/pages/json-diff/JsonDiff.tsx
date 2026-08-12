import { useRef, useState, useCallback, useEffect } from 'react'
import { GitCompare } from 'lucide-react'
import type { OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import JsonEditorPane from './JsonEditorPane'
import ChangeSummary from './ChangeSummary'
import { createJsonDiff } from './diff/createJsonDiff'
import {
  applyDiffDecorations,
  clearDiffDecorations,
  type MonacoEditor,
  type DecorationsCollection,
} from './monaco/applyDiffDecorations'
import type { JsonChange } from './diff/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'

const DEBOUNCE_MS = 300

const DEFAULT_ORIGINAL = JSON.stringify(
  {
    customer: {
      name: 'John',
      address: { city: 'Colombo', country: 'Sri Lanka' },
      phone: '123456',
    },
    items: ['Apple', 'Orange', 'Banana'],
  },
  null,
  2,
)

const DEFAULT_MODIFIED = JSON.stringify(
  {
    customer: {
      name: 'Johnny',
      address: { city: 'Colombo', country: 'Sri Lanka' },
      email: 'john@example.com',
    },
    items: ['Apple', 'Mango', 'Banana'],
  },
  null,
  2,
)

export default function JsonDiff() {
  const [savedOriginal, setSavedOriginal] = useLocalStorage('json-diff:original', DEFAULT_ORIGINAL)
  const [savedModified, setSavedModified] = useLocalStorage('json-diff:modified', DEFAULT_MODIFIED)

  const monacoRef = useRef<typeof Monaco | null>(null)
  const originalEditorRef = useRef<MonacoEditor | null>(null)
  const modifiedEditorRef = useRef<MonacoEditor | null>(null)
  const originalCollectionRef = useRef<DecorationsCollection | null>(null)
  const modifiedCollectionRef = useRef<DecorationsCollection | null>(null)

  const originalTextRef = useRef<string>(savedOriginal)
  const modifiedTextRef = useRef<string>(savedModified)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [changes, setChanges] = useState<JsonChange[] | null>(null)

  const runDiff = useCallback(() => {
    const monaco = monacoRef.current
    const origEditor = originalEditorRef.current
    const modEditor = modifiedEditorRef.current
    const origCol = originalCollectionRef.current
    const modCol = modifiedCollectionRef.current

    if (!monaco || !origEditor || !modEditor || !origCol || !modCol) return

    const result = createJsonDiff(originalTextRef.current, modifiedTextRef.current)

    if (!result) {
      clearDiffDecorations(origCol, modCol)
      setChanges(null)
      return
    }

    applyDiffDecorations(monaco, origEditor, modEditor, origCol, modCol, result.changes)
    setChanges(result.changes)
  }, [])

  const scheduleDiff = useCallback(() => {
    if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(runDiff, DEBOUNCE_MS)
  }, [runDiff])

  const handleOriginalMount: OnMount = useCallback(
    (editor, monaco) => {
      monacoRef.current = monaco
      originalEditorRef.current = editor
      originalCollectionRef.current = editor.createDecorationsCollection()
      // Run initial diff once both editors are mounted
      if (modifiedEditorRef.current) runDiff()
    },
    [runDiff],
  )

  const handleModifiedMount: OnMount = useCallback(
    (editor) => {
      modifiedEditorRef.current = editor
      modifiedCollectionRef.current = editor.createDecorationsCollection()
      if (originalEditorRef.current) runDiff()
    },
    [runDiff],
  )

  const handleOriginalChange = useCallback(
    (value: string) => {
      originalTextRef.current = value
      setSavedOriginal(value)
      scheduleDiff()
    },
    [scheduleDiff, setSavedOriginal],
  )

  const handleModifiedChange = useCallback(
    (value: string) => {
      modifiedTextRef.current = value
      setSavedModified(value)
      scheduleDiff()
    },
    [scheduleDiff, setSavedModified],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      <header className="flex shrink-0 items-center gap-6 border-b border-[#3c3c3c] bg-[#252526] px-5 py-3">
        <h1 className="m-0 inline-flex items-center gap-1.5 text-base font-semibold text-[#cccccc]">
          <GitCompare size={16} aria-hidden="true" />
          JSON Diff
        </h1>
        <ChangeSummary changes={changes} />
      </header>
      <div className="flex flex-1 [gap:1px] overflow-hidden bg-[#3c3c3c]">
        <JsonEditorPane
          label="Original JSON"
          defaultValue={savedOriginal}
          onMount={handleOriginalMount}
          onChange={handleOriginalChange}
        />
        <JsonEditorPane
          label="Modified JSON"
          defaultValue={savedModified}
          onMount={handleModifiedMount}
          onChange={handleModifiedChange}
        />
      </div>
    </div>
  )
}
