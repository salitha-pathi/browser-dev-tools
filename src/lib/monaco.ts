import type * as MonacoEditor from 'monaco-editor'

type EditorOptions = MonacoEditor.editor.IStandaloneEditorConstructionOptions

/** Standard options for JSON editor input panels */
export const monacoJsonOptions: EditorOptions = {
  minimap: { enabled: false },
  automaticLayout: true,
  fontSize: 13,
  lineNumbers: 'on',
  padding: { top: 8, bottom: 8 },
}

/** Options for read-only JSON/text viewer panels */
export const monacoReadOnlyOptions: EditorOptions = {
  ...monacoJsonOptions,
  readOnly: true,
  domReadOnly: true,
  wordWrap: 'on',
}
