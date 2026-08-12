import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { monacoJsonOptions } from '@/lib/monaco'
import { useConfirmAction } from '@/hooks/useConfirmAction'
import type { ChatConfigState, ConfigIssues, ToolChoiceMode, UpdateConfig } from '../types'

const TOOL_CHOICE_OPTIONS: Array<{ value: ToolChoiceMode; description: string }> = [
  { value: 'auto', description: 'Model chooses if and when to call tools.' },
  { value: 'none', description: 'Disable tool calling and force plain text output.' },
  { value: 'required', description: 'Model must choose one of the provided tools.' },
  { value: 'custom', description: 'Send a custom JSON object for fine-grained routing.' },
]

interface ToolsTabPanelProps {
  cfg: ChatConfigState
  toolSpecJson: string
  configIssues: ConfigIssues
  onUpdateConfig: UpdateConfig
  onToolSpecJsonChange: (value: string) => void
}

interface ToolDraft {
  id: string
  json: string
}

const DEFAULT_TOOL_JSON = `{
  "type": "function",
  "function": {
    "name": "my_function",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  }
}`

function parseToolArray(raw: string): ToolDraft[] {
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('tools must be a JSON array')
  }

  return parsed.map((tool) => ({
    id: crypto.randomUUID(),
    json: JSON.stringify(tool, null, 2),
  }))
}

function serializeToolArray(tools: ToolDraft[]): { value?: string; error?: string } {
  const parsedTools: unknown[] = []

  for (const [index, tool] of tools.entries()) {
    const trimmed = tool.json.trim()
    if (trimmed.length === 0) {
      return { error: `Tool #${index + 1} is empty.` }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch (error) {
      return { error: `Tool #${index + 1} has invalid JSON: ${(error as Error).message}` }
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { error: `Tool #${index + 1} must be a JSON object.` }
    }

    parsedTools.push(parsed)
  }

  return { value: JSON.stringify(parsedTools, null, 2) }
}

export function ToolsTabPanel({
  cfg,
  toolSpecJson,
  configIssues,
  onUpdateConfig,
  onToolSpecJsonChange,
}: ToolsTabPanelProps) {
  const [toolDrafts, setToolDrafts] = useState<ToolDraft[]>(() => {
    try {
      const parsed = parseToolArray(toolSpecJson)
      return parsed.length > 0 ? parsed : [{ id: crypto.randomUUID(), json: DEFAULT_TOOL_JSON }]
    } catch {
      return [{ id: crypto.randomUUID(), json: DEFAULT_TOOL_JSON }]
    }
  })
  const [toolDraftError, setToolDraftError] = useState<string | null>(null)
  const deleteConfirm = useConfirmAction()

  useEffect(() => {
    try {
      const parsed = parseToolArray(toolSpecJson)
      setToolDrafts(
        parsed.length > 0 ? parsed : [{ id: crypto.randomUUID(), json: DEFAULT_TOOL_JSON }],
      )
      setToolDraftError(null)
    } catch {
      setToolDraftError(configIssues.toolSpecJson ?? null)
    }
  }, [toolSpecJson, configIssues.toolSpecJson])

  const updateToolDrafts = (nextDrafts: ToolDraft[]) => {
    setToolDrafts(nextDrafts)
    deleteConfirm.disarm()

    const serialized = serializeToolArray(nextDrafts)
    if (serialized.error !== undefined) {
      setToolDraftError(serialized.error)
      return
    }

    setToolDraftError(null)
    onToolSpecJsonChange(serialized.value ?? '[]')
  }

  const updateToolDraft = (id: string, value: string) => {
    updateToolDrafts(
      toolDrafts.map((draft) => (draft.id === id ? { ...draft, json: value } : draft)),
    )
  }

  const addToolDraft = () => {
    updateToolDrafts([...toolDrafts, { id: crypto.randomUUID(), json: DEFAULT_TOOL_JSON }])
  }

  const removeToolDraft = (id: string) => {
    if (toolDrafts.length === 1) {
      updateToolDrafts([])
      return
    }
    updateToolDrafts(toolDrafts.filter((draft) => draft.id !== id))
  }

  const onDeleteToolClick = (id: string) => {
    if (deleteConfirm.arm(id)) removeToolDraft(id)
  }

  return (
    <section className="chat-completions__panel" role="tabpanel">
      <div className="chat-completions__config-layout">
        <section className="chat-completions__config-card">
          <h3>Tool Selection</h3>

          <fieldset className="chat-completions__tools-choice-group">
            <div className="chat-completions__tools-choice-grid">
              {TOOL_CHOICE_OPTIONS.map(({ value, description }) => (
                <label key={value} className="chat-completions__tools-choice-option">
                  <input
                    type="radio"
                    name="cc-tool-choice-mode"
                    checked={cfg.toolChoiceMode === value}
                    onChange={() => onUpdateConfig('toolChoiceMode', value)}
                  />
                  <span className="chat-completions__tools-choice-copy">
                    <strong>{value}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="chat-completions__tools-switches">
            <label className="chat-completions__toggle">
              <input
                type="checkbox"
                checked={cfg.parallelToolCalls}
                onChange={(event) => onUpdateConfig('parallelToolCalls', event.target.checked)}
              />
              <span>Allow parallel tool calls</span>
            </label>
          </div>

          {cfg.toolChoiceMode === 'custom' && (
            <div className="chat-completions__tools-custom-wrap">
              <label className="chat-completions__tools-custom-label">
                tool_choice JSON object
              </label>
              <div className="chat-completions__editor chat-completions__editor--content">
                <Editor
                  language="json"
                  value={cfg.toolChoiceJson}
                  theme="vs-dark"
                  height="180px"
                  options={monacoJsonOptions}
                  onChange={(value) => onUpdateConfig('toolChoiceJson', value ?? '')}
                />
              </div>
              {configIssues.toolChoiceJson !== undefined && (
                <p className="chat-completions__field-error">{configIssues.toolChoiceJson}</p>
              )}
            </div>
          )}
        </section>

        <section className="chat-completions__config-card">
          <h3>Tool Definitions</h3>
          <div className="chat-completions__tools-list">
            {toolDrafts.map((tool, index) => (
              <article className="chat-completions__tools-item" key={tool.id}>
                <div className="chat-completions__tools-item-head">
                  <span className="chat-completions__tools-item-index">Tool #{index + 1}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className={`chat-completions__small-btn chat-completions__small-btn--danger ${
                      deleteConfirm.armedId === tool.id ? 'chat-completions__small-btn--armed' : ''
                    }`}
                    onClick={() => onDeleteToolClick(tool.id)}
                    title={
                      deleteConfirm.armedId === tool.id
                        ? 'Click again to confirm delete'
                        : 'Prepare delete confirmation'
                    }
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {deleteConfirm.armedId === tool.id ? 'Sure?' : 'Delete'}
                  </Button>
                </div>

                <div className="chat-completions__editor chat-completions__editor--content">
                  <Editor
                    language="json"
                    value={tool.json}
                    theme="vs-dark"
                    height="220px"
                    options={monacoJsonOptions}
                    onChange={(value) => updateToolDraft(tool.id, value ?? '')}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="chat-completions__tools-footer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="chat-completions__small-btn"
              onClick={addToolDraft}
            >
              <Plus size={12} aria-hidden="true" /> Add tool
            </Button>
          </div>

          {(toolDraftError !== null || configIssues.toolSpecJson !== undefined) && (
            <p className="chat-completions__field-error">
              {toolDraftError ?? configIssues.toolSpecJson}
            </p>
          )}
        </section>
      </div>
    </section>
  )
}
