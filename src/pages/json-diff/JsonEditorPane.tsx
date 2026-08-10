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

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    onMount(editor, monaco)
  }

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
    <div className="editor-pane">
      <div className="editor-pane__header">
        <span className="editor-pane__label">{label}</span>
        <button type="button" className="editor-pane__format-btn" onClick={handleFormat}>
          Format JSON
        </button>
      </div>
      <div className="editor-pane__body">
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
