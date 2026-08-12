import { useRef, useCallback } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { formatJson } from '@/utils/json'

interface Props {
  label: string
  defaultValue: string
  onMount: OnMount
  onChange: (value: string) => void
}

export default function JsonEditorPane({ label, defaultValue, onMount, onChange }: Props) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor
      onMount(editor, monaco)
    },
    [onMount],
  )

  const handleFormat = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (!model) return
    const formatted = formatJson(model.getValue())
    if (formatted !== model.getValue()) {
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: formatted }],
        () => null,
      )
    }
  }, [])

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-3 py-[0.4rem]">
        <span className="text-[0.8125rem] font-medium tracking-[0.04em] text-[#9d9d9d] uppercase">
          {label}
        </span>
        <button
          type="button"
          className="cursor-pointer rounded border border-[#4a4a4a] bg-[#2d2d2d] px-[0.6rem] py-[0.2rem] text-[0.75rem] text-[#c8c8c8] transition hover:bg-[#3a3a3a]"
          onClick={handleFormat}
        >
          Format JSON
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          defaultLanguage="json"
          defaultValue={defaultValue}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'off',
            automaticLayout: true,
          }}
          onMount={handleMount}
          onChange={(v) => onChange(v ?? '')}
        />
      </div>
    </div>
  )
}
