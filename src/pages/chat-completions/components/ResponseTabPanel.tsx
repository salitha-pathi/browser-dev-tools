import { Check, Copy, Settings } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { monacoReadOnlyOptions } from '@/lib/monaco'
import { formatJson } from '@/utils/json'

type ResponseView = 'preview' | 'headers' | 'raw'
type ResponseActionMenu = 'preview' | 'raw' | null

interface ResponseTabPanelProps {
  running: boolean
  responseStatusCode: number | null
  responseOk: boolean | null
  responseContentType: string
  responseReceivedAt: string
  responseHeaders: Array<[string, string]>
  responseBody: string
}

interface ParsedResponseView {
  summary: Record<string, string>
  textBlocks: string[]
  toolCalls: Array<{ id: string; name: string; arguments: string }>
  usage: Record<string, unknown> | null
  parseError: string | null
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function pushUniqueText(target: string[], value: unknown): void {
  if (typeof value !== 'string') return
  const trimmed = value.trim()
  if (trimmed.length === 0 || target.includes(trimmed)) return
  target.push(trimmed)
}

function pushTextCandidate(target: string[], value: unknown): void {
  if (typeof value === 'string') {
    pushUniqueText(target, value)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      pushTextCandidate(target, item)
    }
    return
  }

  const valueObj = toRecord(value)
  if (valueObj === null) return
  if (typeof valueObj.value === 'string') pushUniqueText(target, valueObj.value)
  if (typeof valueObj.text === 'string') pushUniqueText(target, valueObj.text)
  if (typeof valueObj.output_text === 'string') pushUniqueText(target, valueObj.output_text)
  if (typeof valueObj.transcript === 'string') pushUniqueText(target, valueObj.transcript)
}

function extractContentPartText(part: unknown, collector: string[]): void {
  const partObj = toRecord(part)
  if (partObj === null) return

  pushTextCandidate(collector, partObj.text)
  pushTextCandidate(collector, partObj.output_text)
  pushTextCandidate(collector, partObj.refusal)
  pushTextCandidate(collector, partObj.transcript)
  pushTextCandidate(collector, partObj.summary)
}

function extractChatMessageText(content: unknown, collector: string[]): void {
  if (typeof content === 'string') {
    pushUniqueText(collector, content)
    return
  }

  const contentObj = toRecord(content)
  if (contentObj !== null) {
    extractContentPartText(contentObj, collector)
    return
  }

  if (!Array.isArray(content)) return

  for (const part of content) {
    extractContentPartText(part, collector)
  }
}

function extractToolCalls(
  toolCallSource: unknown,
): Array<{ id: string; name: string; arguments: string }> {
  const toolCalls: Array<{ id: string; name: string; arguments: string }> = []
  const list = Array.isArray(toolCallSource) ? toolCallSource : []

  for (const toolCall of list) {
    const toolObj = toRecord(toolCall)
    if (toolObj === null) continue

    const fn = toRecord(toolObj.function)
    const argsValue = fn?.arguments ?? toolObj.arguments
    const argsText =
      typeof argsValue === 'string'
        ? argsValue
        : argsValue === undefined
          ? ''
          : JSON.stringify(argsValue, null, 2)

    toolCalls.push({
      id:
        typeof toolObj.call_id === 'string'
          ? toolObj.call_id
          : typeof toolObj.id === 'string'
            ? toolObj.id
            : String(toolCalls.length + 1),
      name:
        typeof fn?.name === 'string'
          ? fn.name
          : typeof toolObj.name === 'string'
            ? toolObj.name
            : 'function',
      arguments: argsText,
    })
  }

  return toolCalls
}

function parseResponseBody(rawBody: string): ParsedResponseView {
  if (rawBody.trim().length === 0) {
    return {
      summary: {},
      textBlocks: [],
      toolCalls: [],
      usage: null,
      parseError: null,
    }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawBody)
  } catch {
    return {
      summary: {},
      textBlocks: [rawBody],
      toolCalls: [],
      usage: null,
      parseError: 'Response is not JSON. Showing raw text preview only.',
    }
  }

  const root = toRecord(parsedJson)
  if (root === null) {
    return {
      summary: {},
      textBlocks: [],
      toolCalls: [],
      usage: null,
      parseError: 'JSON response is not an object.',
    }
  }

  const summary: Record<string, string> = {}
  const textBlocks: string[] = []
  const toolCalls: Array<{ id: string; name: string; arguments: string }> = []

  const pushSummary = (label: string, value: unknown) => {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && value.trim().length === 0) return
    summary[label] = String(value)
  }

  const candidateRoots: Record<string, unknown>[] = [root]
  const nestedResponse = toRecord(root.response)
  if (nestedResponse !== null) candidateRoots.push(nestedResponse)

  for (const currentRoot of candidateRoots) {
    pushSummary('object', currentRoot.object)
    pushSummary('id', currentRoot.id)
    pushSummary('model', currentRoot.model)
    pushSummary('status', currentRoot.status)
    pushSummary('service_tier', currentRoot.service_tier)
    pushSummary('system_fingerprint', currentRoot.system_fingerprint)
    pushSummary('request_id', currentRoot.request_id)

    pushTextCandidate(textBlocks, currentRoot.output_text)
    pushTextCandidate(textBlocks, currentRoot.content)

    const choices = Array.isArray(currentRoot.choices) ? currentRoot.choices : []
    for (const choice of choices) {
      const choiceObj = toRecord(choice)
      if (choiceObj === null) continue

      pushTextCandidate(textBlocks, choiceObj.text)
      pushTextCandidate(textBlocks, choiceObj.output_text)

      const message = toRecord(choiceObj.message)
      if (message !== null) {
        extractChatMessageText(message.content, textBlocks)
        pushTextCandidate(textBlocks, message.refusal)
        toolCalls.push(...extractToolCalls(message.tool_calls))
      }

      const delta = toRecord(choiceObj.delta)
      if (delta !== null) {
        extractChatMessageText(delta.content, textBlocks)
        pushTextCandidate(textBlocks, delta.refusal)
        toolCalls.push(...extractToolCalls(delta.tool_calls))
      }
    }

    const output = Array.isArray(currentRoot.output) ? currentRoot.output : []
    for (const item of output) {
      const itemObj = toRecord(item)
      if (itemObj === null) continue

      const itemType = typeof itemObj.type === 'string' ? itemObj.type : ''
      if (itemType === 'function_call' || itemType === 'custom_tool_call') {
        toolCalls.push(...extractToolCalls([itemObj]))
      }

      extractChatMessageText(itemObj.content, textBlocks)
      pushTextCandidate(textBlocks, itemObj.text)
      pushTextCandidate(textBlocks, itemObj.output_text)
      pushTextCandidate(textBlocks, itemObj.summary)
      pushTextCandidate(textBlocks, itemObj.transcript)
    }
  }

  return {
    summary,
    textBlocks,
    toolCalls,
    usage: toRecord(root.usage),
    parseError: null,
  }
}

function formatToolArguments(argumentsText: string): string {
  const trimmed = argumentsText.trim()
  if (trimmed.length === 0) return '{}'
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch {
    return argumentsText
  }
}

function parseToolArgumentsValue(argumentsText: string): unknown {
  const trimmed = argumentsText.trim()
  if (trimmed.length === 0) return {}
  try {
    return JSON.parse(trimmed)
  } catch {
    return argumentsText
  }
}

function buildPreviewText(parsed: ParsedResponseView): string {
  const lines: string[] = []
  if (parsed.parseError) lines.push(`parse_warning: ${parsed.parseError}`)

  if (parsed.textBlocks.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('assistant_output:')
    parsed.textBlocks.forEach((text, index) => {
      lines.push(`--- output_${index + 1} ---`)
      lines.push(text)
    })
  } else if (parsed.toolCalls.length > 0) {
    const toolCallPayload =
      parsed.toolCalls.length === 1
        ? formatToolArguments(parsed.toolCalls[0].arguments)
        : JSON.stringify(
            parsed.toolCalls.map((toolCall) => ({
              name: toolCall.name,
              id: toolCall.id,
              arguments: parseToolArgumentsValue(toolCall.arguments),
            })),
            null,
            2,
          )

    if (lines.length > 0) lines.push('')
    lines.push(toolCallPayload)
  }

  return lines.length > 0 ? lines.join('\n') : 'No preview content available.'
}

export function ResponseTabPanel({
  running,
  responseStatusCode,
  responseOk,
  responseContentType,
  responseReceivedAt,
  responseHeaders,
  responseBody,
}: ResponseTabPanelProps) {
  const [activeView, setActiveView] = useState<ResponseView>('preview')
  const [actionMenu, setActionMenu] = useState<ResponseActionMenu>(null)
  const [previewAsJson, setPreviewAsJson] = useState(false)
  const [rawAsJson, setRawAsJson] = useState(true)
  const [copiedTarget, setCopiedTarget] = useState<'preview' | 'raw' | null>(null)

  const previewMenuRef = useRef<HTMLDivElement | null>(null)
  const rawMenuRef = useRef<HTMLDivElement | null>(null)

  const parsed = useMemo(() => parseResponseBody(responseBody), [responseBody])
  const previewText = useMemo(() => buildPreviewText(parsed), [parsed])
  const previewValue = useMemo(
    () => (previewAsJson ? formatJson(previewText) : previewText),
    [previewAsJson, previewText],
  )

  const rawValue = useMemo(
    () => (rawAsJson ? formatJson(responseBody) : responseBody),
    [rawAsJson, responseBody],
  )

  const headerEntries = useMemo(() => {
    const list: Array<[string, string]> = []
    const seen = new Set<string>()

    const add = (key: string, value: unknown) => {
      if (value === undefined || value === null) return
      const text = String(value).trim()
      if (text.length === 0) return
      const normalized = key.toLowerCase()
      if (seen.has(normalized)) return
      seen.add(normalized)
      list.push([key, text])
    }

    add('http-status', responseStatusCode === null ? undefined : responseStatusCode)
    add('response-ok', responseOk === null ? undefined : responseOk)
    add('content-type', responseContentType)
    add('received-at', responseReceivedAt)

    add('body.object', parsed.summary.object)
    add('body.id', parsed.summary.id)
    add('body.model', parsed.summary.model)
    add('body.status', parsed.summary.status)
    add('body.request_id', parsed.summary.request_id)

    if (parsed.usage !== null) {
      add('usage.total_tokens', parsed.usage.total_tokens)
      add('usage.prompt_tokens', parsed.usage.prompt_tokens)
      add('usage.completion_tokens', parsed.usage.completion_tokens)
      add('usage.input_tokens', parsed.usage.input_tokens)
      add('usage.output_tokens', parsed.usage.output_tokens)
    }

    for (const [key, value] of responseHeaders) {
      add(key, value)
    }

    return list
  }, [
    parsed.summary.id,
    parsed.summary.model,
    parsed.summary.object,
    parsed.summary.request_id,
    parsed.summary.status,
    parsed.usage,
    responseContentType,
    responseHeaders,
    responseOk,
    responseReceivedAt,
    responseStatusCode,
  ])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node
      if (actionMenu === 'preview' && previewMenuRef.current?.contains(target)) return
      if (actionMenu === 'raw' && rawMenuRef.current?.contains(target)) return
      setActionMenu(null)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionMenu(null)
    }

    if (actionMenu !== null) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [actionMenu])

  const copyText = async (value: string, target: 'preview' | 'raw') => {
    if (value.trim().length === 0) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedTarget(target)
      setTimeout(() => {
        setCopiedTarget((current) => (current === target ? null : current))
      }, 1200)
    } catch {
      // Clipboard access can fail in restricted contexts.
    }
  }

  const statusLabel = running
    ? 'Waiting'
    : responseStatusCode === null
      ? 'No response'
      : `HTTP ${responseStatusCode}`
  const showStatusChip = running || responseStatusCode !== null
  const hasMetaBadges =
    showStatusChip ||
    responseContentType.trim().length > 0 ||
    responseReceivedAt.trim().length > 0 ||
    Boolean(parsed.summary.object) ||
    Boolean(parsed.summary.id) ||
    Boolean(parsed.summary.model) ||
    parsed.toolCalls.length > 0

  const activeTextView = activeView === 'raw' ? 'raw' : 'preview'
  const activeTextValue = activeTextView === 'preview' ? previewValue : rawValue
  const activeMenuOpen = actionMenu === activeTextView
  const responseMetaDetails = useMemo(() => {
    const lines: string[] = []
    const pushLine = (label: string, value: string | undefined) => {
      if (!value) return
      lines.push(`${label}: ${value}`)
    }

    pushLine('object', parsed.summary.object)
    pushLine('id', parsed.summary.id)
    pushLine('model', parsed.summary.model)

    if (parsed.toolCalls.length > 0) {
      lines.push('tool_calls:')
      parsed.toolCalls.forEach((call, index) => {
        lines.push(`- call_${index + 1}: ${call.name} (${call.id})`)
        if (call.arguments.trim().length > 0) {
          lines.push(call.arguments)
        }
      })
    }

    return lines.join('\n')
  }, [parsed.summary.id, parsed.summary.model, parsed.summary.object, parsed.toolCalls])

  return (
    <section className="chat-completions__panel" role="tabpanel">
      <section className="chat-completions__config-card">
        <div className="chat-completions__response-head">
          <h3>Response</h3>
        </div>

        <TabsList className="chat-completions__tabs-list chat-completions__response-views">
          <TabsTrigger
            type="button"
            active={activeView === 'preview'}
            className="chat-completions__tab-trigger"
            onClick={() => setActiveView('preview')}
          >
            Preview
          </TabsTrigger>
          <TabsTrigger
            type="button"
            active={activeView === 'raw'}
            className="chat-completions__tab-trigger"
            onClick={() => setActiveView('raw')}
          >
            Raw
          </TabsTrigger>
          <TabsTrigger
            type="button"
            active={activeView === 'headers'}
            className="chat-completions__tab-trigger"
            onClick={() => setActiveView('headers')}
          >
            Headers
          </TabsTrigger>
        </TabsList>

        <div className="chat-completions__response-toolbar">
          {hasMetaBadges && (
            <div className="chat-completions__response-meta" aria-live="polite">
              {showStatusChip && (
                <span
                  className={`chat-completions__response-chip ${
                    responseStatusCode === null
                      ? ''
                      : responseOk
                        ? 'chat-completions__response-chip--ok'
                        : 'chat-completions__response-chip--error'
                  }`}
                >
                  {statusLabel}
                </span>
              )}
              {responseContentType.trim().length > 0 && (
                <span className="chat-completions__response-chip">{responseContentType}</span>
              )}
              {responseReceivedAt.trim().length > 0 && (
                <span className="chat-completions__response-chip">{responseReceivedAt}</span>
              )}

              {parsed.summary.object && (
                <span className="chat-completions__response-chip">
                  object: {parsed.summary.object}
                </span>
              )}

              {parsed.summary.id && <span className="chat-completions__response-chip">id</span>}

              {parsed.summary.model && (
                <span className="chat-completions__response-chip">
                  model: {parsed.summary.model}
                </span>
              )}

              {parsed.toolCalls.length > 0 && (
                <span className="chat-completions__response-chip">
                  tool_calls: {parsed.toolCalls.length}
                </span>
              )}

              {responseMetaDetails.length > 0 && (
                <button
                  type="button"
                  className="chat-completions__response-meta-more"
                  title={responseMetaDetails}
                  aria-label="Show response metadata details"
                >
                  More
                </button>
              )}
            </div>
          )}

          {(activeView === 'preview' || activeView === 'raw') && (
            <div
              className="chat-completions__response-view-actions"
              ref={activeTextView === 'preview' ? previewMenuRef : rawMenuRef}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="chat-completions__small-btn"
                onClick={() => void copyText(activeTextValue, activeTextView)}
                disabled={activeTextValue.trim().length === 0}
              >
                {copiedTarget === activeTextView ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                {copiedTarget === activeTextView ? 'Copied' : 'Copy'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="chat-completions__small-btn"
                onClick={() =>
                  setActionMenu((current) => (current === activeTextView ? null : activeTextView))
                }
                aria-haspopup="menu"
                aria-expanded={activeMenuOpen}
                title={`${activeTextView === 'preview' ? 'Preview' : 'Raw'} view settings`}
              >
                <Settings size={14} aria-hidden="true" />
              </Button>

              {activeMenuOpen && (
                <div className="chat-completions__response-view-menu" role="menu">
                  <label className="chat-completions__response-view-toggle" role="menuitemcheckbox">
                    <input
                      type="checkbox"
                      checked={activeTextView === 'preview' ? previewAsJson : rawAsJson}
                      onChange={(event) => {
                        if (activeTextView === 'preview') {
                          setPreviewAsJson(event.target.checked)
                          return
                        }
                        setRawAsJson(event.target.checked)
                      }}
                    />
                    Format as JSON
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {activeView === 'preview' && (
          <section className="chat-completions__response-preview">
            {parsed.parseError !== null && (
              <p className="chat-completions__field-warning">{parsed.parseError}</p>
            )}

            <div className="chat-completions__editor chat-completions__editor--large">
              <Editor
                language={previewAsJson ? 'json' : 'plaintext'}
                value={previewValue}
                theme="vs-dark"
                height="100%"
                options={monacoReadOnlyOptions}
              />
            </div>
          </section>
        )}

        {activeView === 'headers' && (
          <section className="chat-completions__response-headers">
            {headerEntries.length > 0 ? (
              <div
                className="chat-completions__response-headers-table"
                role="table"
                aria-label="Response headers"
              >
                {headerEntries.map(([key, value]) => (
                  <div className="chat-completions__response-header-row" role="row" key={key}>
                    <span className="chat-completions__response-header-key" role="cell">
                      {key}
                    </span>
                    <span className="chat-completions__response-header-value" role="cell">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="chat-completions__response-empty">No response headers captured yet.</p>
            )}
          </section>
        )}

        {activeView === 'raw' && (
          <section className="chat-completions__response-preview">
            <div className="chat-completions__editor chat-completions__editor--large">
              <Editor
                language={rawAsJson ? 'json' : 'plaintext'}
                value={rawValue}
                theme="vs-dark"
                height="100%"
                options={monacoReadOnlyOptions}
              />
            </div>
          </section>
        )}
      </section>
    </section>
  )
}
