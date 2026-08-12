import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { ArrowLeftRight, Check, Copy, Eraser, Settings, Sparkles, WandSparkles } from 'lucide-react'
import { converters, type JsQuote } from './converters'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import './TextEscape.css'

type Direction = 'escape' | 'unescape'

function getCharacterCount(text: string): string {
  const chars = [...text].length
  return `${chars} ${chars === 1 ? 'char' : 'chars'}`
}

export default function TextEscape() {
  const [input, setInput] = useLocalStorage('text-escape:input', '')
  const [modeId, setModeId] = useLocalStorage('text-escape:mode', converters[0].id)
  const [direction, setDirection] = useLocalStorage<Direction>('text-escape:direction', 'escape')
  const [autoConvert, setAutoConvert] = useLocalStorage('text-escape:auto', true)
  const [jsonIncludeQuotes, setJsonIncludeQuotes] = useLocalStorage(
    'text-escape:json-quotes',
    false,
  )
  const [jsQuote, setJsQuote] = useLocalStorage<JsQuote>('text-escape:js-quote', 'double')

  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'input' | 'output' | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)

  const converter = useMemo(
    () => converters.find((item) => item.id === modeId) ?? converters[0],
    [modeId],
  )

  const convert = useCallback(() => {
    const result =
      direction === 'escape'
        ? converter.escape(input, { jsonIncludeQuotes, jsQuote })
        : converter.unescape(input, { jsonIncludeQuotes, jsQuote })

    if (result.error !== undefined) {
      setError(result.error)
      setOutput('')
      return
    }

    setError(null)
    setOutput(result.output)
  }, [converter, direction, input, jsonIncludeQuotes, jsQuote])

  useEffect(() => {
    if (!autoConvert) return
    convert()
  }, [autoConvert, convert])

  const canShowJsonQuotesToggle = converter.id === 'json-string'
  const canShowJsQuoteToggle = converter.id === 'js-string' && direction === 'escape'

  const handleReverseFlow = useCallback(() => {
    setInput(output)
    setOutput(input)
    setError(null)
    setDirection((prev) => (prev === 'escape' ? 'unescape' : 'escape'))
  }, [input, output, setDirection, setInput])

  const clearAll = useCallback(() => {
    setInput('')
    setOutput('')
    setError(null)
    setClearConfirm(false)
  }, [setInput])

  const handleClearClick = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }
    clearAll()
  }, [clearAll, clearConfirm])

  const copyText = useCallback(async (value: string, target: 'input' | 'output') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(target)
      setTimeout(() => setCopied((prev) => (prev === target ? null : prev)), 1200)
    } catch {
      // Clipboard access can fail in restricted contexts
    }
  }, [])

  const inputLabel = direction === 'escape' ? 'Raw Input' : 'Escaped Input'
  const outputLabel = direction === 'escape' ? 'Escaped Output' : 'Raw Output'
  const flowText = direction === 'escape' ? 'Raw -> Escaped' : 'Escaped -> Raw'

  useEffect(() => {
    if (!clearConfirm) return
    const timer = setTimeout(() => setClearConfirm(false), 2500)
    return () => clearTimeout(timer)
  }, [clearConfirm])

  useEffect(() => {
    if (!settingsOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (!settingsRef.current) return
      if (!settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  return (
    <div className="text-escape">
      <header className="text-escape__header">
        <div className="text-escape__title-row">
          <h1 className="text-escape__title">
            <Sparkles className="text-escape__title-icon" aria-hidden="true" />
            Text Escape Lab
          </h1>
          <span className={`text-escape__status ${error ? 'text-escape__status--error' : ''}`}>
            {error ?? 'Ready'}
          </span>
        </div>

        <div className="text-escape__toolbar">
          <div className="text-escape__modes" role="radiogroup" aria-label="Conversion mode">
            {converters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={modeId === item.id}
                className={`text-escape__mode-chip ${modeId === item.id ? 'text-escape__mode-chip--active' : ''}`}
                onClick={() => setModeId(item.id)}
                title={item.description}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-escape__controls">
            <button
              type="button"
              className={`text-escape__button ${autoConvert ? 'text-escape__button--auto-active' : ''}`}
              onClick={convert}
              title={autoConvert ? 'Auto convert is ON' : 'Run conversion'}
            >
              <WandSparkles size={14} aria-hidden="true" />
              Convert
            </button>

            <button
              type="button"
              className={`text-escape__button ${clearConfirm ? 'text-escape__button--danger' : 'text-escape__button--warning'}`}
              onClick={handleClearClick}
              title={clearConfirm ? 'Click again to confirm clear' : 'Prepare clear confirmation'}
            >
              <Eraser size={14} aria-hidden="true" />
              {clearConfirm ? 'Sure?' : 'Clear'}
            </button>

            <div className="text-escape__settings" ref={settingsRef}>
              <button
                type="button"
                className="text-escape__button text-escape__settings-trigger"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                title="Conversion settings"
              >
                <Settings size={14} aria-hidden="true" />
              </button>

              {settingsOpen && (
                <div className="text-escape__settings-menu" role="menu" aria-label="Settings">
                  <label className="text-escape__toggle" title="Convert as you type">
                    <input
                      type="checkbox"
                      checked={autoConvert}
                      onChange={(event) => setAutoConvert(event.target.checked)}
                    />
                    Auto convert
                  </label>

                  {canShowJsonQuotesToggle && (
                    <label
                      className="text-escape__toggle"
                      title="Wrap escaped output with quotes and accept quoted input when unescaping"
                    >
                      <input
                        type="checkbox"
                        checked={jsonIncludeQuotes}
                        onChange={(event) => setJsonIncludeQuotes(event.target.checked)}
                      />
                      Include quotes
                    </label>
                  )}

                  {canShowJsQuoteToggle && (
                    <div
                      className="text-escape__toggle text-escape__toggle--stack"
                      title="Choose quote style for JS string escaping"
                    >
                      <span>Quote style</span>
                      <div
                        className="text-escape__quote-group"
                        role="radiogroup"
                        aria-label="JavaScript quote style"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={jsQuote === 'double'}
                          className={`text-escape__quote-chip ${jsQuote === 'double' ? 'text-escape__quote-chip--active' : ''}`}
                          onClick={() => setJsQuote('double')}
                        >
                          &quot;
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={jsQuote === 'single'}
                          className={`text-escape__quote-chip ${jsQuote === 'single' ? 'text-escape__quote-chip--active' : ''}`}
                          onClick={() => setJsQuote('single')}
                        >
                          &apos;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="text-escape__split">
        <section className="text-pane">
          <div className="text-pane__header">
            <span className="text-pane__label text-pane__label--input">{inputLabel}</span>
            <div className="text-pane__actions">
              <span className="text-pane__meta">{getCharacterCount(input)}</span>
              <button
                type="button"
                className="text-pane__icon-btn"
                onClick={() => copyText(input, 'input')}
                title="Copy input"
                aria-label="Copy input"
                disabled={input.length === 0}
              >
                {copied === 'input' ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="text-pane__editor" title={inputLabel}>
            <Editor
              language="plaintext"
              value={input}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
              }}
              onChange={(value) => setInput(value ?? '')}
            />
          </div>
        </section>

        <div className="text-escape__center-control">
          <button
            type="button"
            className="text-escape__center-swap"
            onClick={handleReverseFlow}
            title={`Reverse flow and swap panes (${flowText})`}
            aria-label="Reverse flow and swap panes"
          >
            <ArrowLeftRight size={16} aria-hidden="true" />
          </button>
        </div>

        <section className="text-pane">
          <div className="text-pane__header">
            <span className="text-pane__label text-pane__label--output">{outputLabel}</span>
            <div className="text-pane__actions">
              <span className="text-pane__meta">{getCharacterCount(output)}</span>
              <button
                type="button"
                className="text-pane__icon-btn"
                onClick={() => copyText(output, 'output')}
                title="Copy output"
                aria-label="Copy output"
                disabled={output.length === 0}
              >
                {copied === 'output' ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="text-pane__editor" title={outputLabel}>
            <Editor
              language="plaintext"
              value={output}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
