import { useCallback, useEffect, useMemo, useState } from 'react'
import { decodeJsonStringContent, escapeJsonStringContent } from '@/utils/jsonString'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { asJsonValue } from './helpers'
import { buildPayload, parsePayloadIntoState } from './payload'
import { getBlockingConfigIssueCount, getConfigIssues } from './validation'
import {
  DEFAULT_CONFIG,
  DEFAULT_MESSAGES,
  makeMessage,
  type ChatConfigState,
  type MessageRow,
  type TabId,
} from './types'
import { ChatHeader } from './components/ChatHeader'
import { ConfigTabPanel } from './components/ConfigTabPanel'
import { MessagesTabPanel } from './components/MessagesTabPanel'
import { PayloadTabPanel } from './components/PayloadTabPanel'
import { ResponseTabPanel } from './components/ResponseTabPanel'
import { SettingsTabPanel } from './components/SettingsTabPanel'
import { TabNav } from './components/TabNav'
import { ToolsTabPanel } from './components/ToolsTabPanel'
import './ChatCompletions.css'

interface ResponseState {
  body: string
  statusCode: number | null
  ok: boolean | null
  contentType: string
  receivedAt: string
  headers: Array<[string, string]>
}

const INITIAL_RESPONSE: ResponseState = {
  body: '',
  statusCode: null,
  ok: null,
  contentType: '',
  receivedAt: '',
  headers: [],
}

export default function ChatCompletions() {
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('chat-completions:tab', 'config')
  const [config, setConfig] = useLocalStorage<ChatConfigState>(
    'chat-completions:config',
    DEFAULT_CONFIG,
  )
  const [messages, setMessages] = useLocalStorage<MessageRow[]>(
    'chat-completions:messages',
    DEFAULT_MESSAGES,
  )
  const [toolsJson, setToolsJson] = useLocalStorage<string>('chat-completions:tools', '[]')

  const [status, setStatus] = useState('Ready')
  const [statusTone, setStatusTone] = useState<'idle' | 'ok' | 'error'>('idle')
  const [running, setRunning] = useState(false)
  const [payloadCopied, setPayloadCopied] = useState(false)

  const [payloadEditorText, setPayloadEditorText] = useState('')
  const [payloadEdited, setPayloadEdited] = useState(false)
  const [payloadParseError, setPayloadParseError] = useState<string | null>(null)
  const [response, setResponse] = useState<ResponseState>(INITIAL_RESPONSE)

  const cfg: ChatConfigState = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])

  const configIssues = useMemo(() => getConfigIssues(cfg, toolsJson), [cfg, toolsJson])
  const blockingConfigIssueCount = getBlockingConfigIssueCount(configIssues)
  const blockingIssueMessages = Object.entries(configIssues)
    .filter(([key]) => key !== 'tokenChoice')
    .map(([, message]) => message)

  const updateConfig = useCallback(
    <K extends keyof ChatConfigState>(key: K, value: ChatConfigState[K]) => {
      setConfig((prev) => ({ ...DEFAULT_CONFIG, ...prev, [key]: value }))
    },
    [setConfig],
  )

  const updateMessage = useCallback(
    <K extends keyof MessageRow>(id: string, key: K, value: MessageRow[K]) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)))
    },
    [setMessages],
  )

  const applyMessageTransform = useCallback(
    (id: string, mode: 'escape' | 'unescape') => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m
          if (mode === 'escape') {
            return { ...m, content: escapeJsonStringContent(m.content) }
          }

          const result = decodeJsonStringContent(m.content)
          if (result.error !== undefined) {
            setStatus(result.error)
            setStatusTone('error')
            return m
          }

          return { ...m, content: result.value ?? '' }
        }),
      )
    },
    [setMessages],
  )

  const addMessage = useCallback(() => {
    setMessages((prev) => [...prev, makeMessage()])
  }, [setMessages])

  const removeMessage = useCallback(
    (id: string) => {
      setMessages((prev) => {
        if (prev.length === 1) return prev
        return prev.filter((m) => m.id !== id)
      })
    },
    [setMessages],
  )

  const builtPayload = useMemo(
    () => buildPayload({ cfg, messages, toolsJson, blockingConfigIssueCount }),
    [blockingConfigIssueCount, cfg, messages, toolsJson],
  )

  const generatedPayloadText = useMemo(() => {
    if (builtPayload.error !== undefined) return `// ${builtPayload.error}`
    if (builtPayload.payload === undefined) return '{}'
    return JSON.stringify(builtPayload.payload, null, 2)
  }, [builtPayload])

  useEffect(() => {
    if (!payloadEdited) {
      setPayloadEditorText(generatedPayloadText)
    }
  }, [generatedPayloadText, payloadEdited])

  const resetPayloadEditor = useCallback(() => {
    setPayloadEditorText(generatedPayloadText)
    setPayloadEdited(false)
    setPayloadParseError(null)
    setStatus('Payload editor synced from form values')
    setStatusTone('ok')
  }, [generatedPayloadText])

  const generateFormFromPayload = useCallback(() => {
    const parsed = parsePayloadIntoState(payloadEditorText)
    if (parsed.error !== undefined || parsed.config === undefined) {
      const error = parsed.error ?? 'Payload is required'
      setPayloadParseError(error)
      setStatus(error)
      setStatusTone('error')
      return
    }

    const parsedConfig = parsed.config

    setConfig((prev) => ({ ...parsedConfig, endpoint: prev.endpoint, apiKey: prev.apiKey }))

    if (parsed.messages !== undefined && parsed.messages.length > 0) {
      setMessages(parsed.messages)
    }

    if (parsed.toolsJson !== undefined) {
      setToolsJson(parsed.toolsJson)
    }

    setPayloadEdited(false)
    setPayloadParseError(null)
    setStatus('POST body parsed into app state')
    setStatusTone('ok')
  }, [payloadEditorText, setConfig, setMessages, setToolsJson])

  const copyPayload = useCallback(async () => {
    if (builtPayload.error !== undefined || builtPayload.payload === undefined) {
      const error = builtPayload.error ?? 'Invalid payload'
      setStatus(error)
      setStatusTone('error')
      return
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(builtPayload.payload, null, 2))
      setPayloadCopied(true)
      setTimeout(() => setPayloadCopied(false), 1200)
      setStatus('Payload copied')
      setStatusTone('ok')
    } catch {
      setStatus('Failed to copy payload')
      setStatusTone('error')
    }
  }, [builtPayload])

  const runRequest = useCallback(async () => {
    if (cfg.endpoint.trim().length === 0) {
      setStatus('endpoint is required')
      setStatusTone('error')
      return
    }

    if (builtPayload.error !== undefined || builtPayload.payload === undefined) {
      setStatus(builtPayload.error ?? 'Invalid payload')
      setStatusTone('error')
      return
    }

    const extraHeaders = asJsonValue<Record<string, string>>(cfg.extraHeadersJson, 'extra_headers')
    if (extraHeaders.error !== undefined) {
      setStatus(extraHeaders.error)
      setStatusTone('error')
      return
    }
    if (extraHeaders.value !== undefined) {
      const invalidHeader = Object.entries(extraHeaders.value).find(
        ([, value]) => typeof value !== 'string',
      )
      if (invalidHeader !== undefined) {
        setStatus('Every extra_headers value must be a string')
        setStatusTone('error')
        return
      }
    }

    setRunning(true)
    setStatusTone('idle')
    setStatus('Sending request...')

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(extraHeaders.value ?? {}),
      }
      if (cfg.apiKey.trim().length > 0) {
        headers.Authorization = `Bearer ${cfg.apiKey.trim()}`
      }

      const fetchResponse = await fetch(cfg.endpoint.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(builtPayload.payload),
      })

      const rawBody = await fetchResponse.text()
      setResponse({
        body: rawBody,
        statusCode: fetchResponse.status,
        ok: fetchResponse.ok,
        contentType: fetchResponse.headers.get('content-type') ?? '',
        headers: Array.from(fetchResponse.headers.entries()),
        receivedAt: new Date().toLocaleTimeString(),
      })

      setStatus(`Done (${fetchResponse.status})`)
      setStatusTone(fetchResponse.ok ? 'ok' : 'error')
    } catch (error) {
      const message = (error as Error).message
      setResponse({
        body: message,
        statusCode: null,
        ok: false,
        contentType: '',
        headers: [],
        receivedAt: new Date().toLocaleTimeString(),
      })
      setStatus(message)
      setStatusTone('error')
    } finally {
      setRunning(false)
    }
  }, [builtPayload, cfg])

  return (
    <div className="chat-completions">
      <ChatHeader
        status={status}
        statusTone={statusTone}
        payloadCopied={payloadCopied}
        running={running}
        blockingConfigIssueCount={blockingConfigIssueCount}
        blockingIssueMessages={blockingIssueMessages}
        onCopyPayload={copyPayload}
        onRunRequest={runRequest}
      />

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      <div className="chat-completions__body">
        {activeTab === 'config' && (
          <ConfigTabPanel cfg={cfg} configIssues={configIssues} onUpdateConfig={updateConfig} />
        )}

        {activeTab === 'settings' && (
          <SettingsTabPanel cfg={cfg} configIssues={configIssues} onUpdateConfig={updateConfig} />
        )}

        {activeTab === 'messages' && (
          <MessagesTabPanel
            messages={messages}
            onAddMessage={addMessage}
            onRemoveMessage={removeMessage}
            onUpdateMessage={updateMessage}
            onTransformMessage={applyMessageTransform}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsTabPanel
            cfg={cfg}
            toolSpecJson={toolsJson}
            configIssues={configIssues}
            onUpdateConfig={updateConfig}
            onToolSpecJsonChange={setToolsJson}
          />
        )}

        {activeTab === 'payload' && (
          <PayloadTabPanel
            payloadEdited={payloadEdited}
            payloadParseError={payloadParseError}
            payloadText={payloadEditorText}
            payloadCopied={payloadCopied}
            onResetPayloadEditor={resetPayloadEditor}
            onGenerateFormFromPayload={generateFormFromPayload}
            onPayloadTextChange={(value) => {
              setPayloadEditorText(value)
              setPayloadEdited(value !== generatedPayloadText)
            }}
          />
        )}

        {activeTab === 'response' && (
          <ResponseTabPanel
            running={running}
            responseStatusCode={response.statusCode}
            responseOk={response.ok}
            responseContentType={response.contentType}
            responseReceivedAt={response.receivedAt}
            responseHeaders={response.headers}
            responseBody={response.body}
          />
        )}
      </div>
    </div>
  )
}
