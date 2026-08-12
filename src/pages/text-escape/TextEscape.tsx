import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { ArrowLeftRight, Check, Copy, Eraser, Settings, Sparkles, WandSparkles } from 'lucide-react'
import { converters, type JsQuote } from './converters'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/lib/utils'

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
  useClickOutside(settingsRef, () => setSettingsOpen(false), settingsOpen)

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

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      <header className="flex flex-col gap-3 border-b border-[#3c3c3c] bg-[#252526] px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="m-0 inline-flex items-center gap-1.5 text-base font-semibold text-[#cccccc]">
            <Sparkles size={16} className="text-[#4ec9b0]" aria-hidden="true" />
            Text Escape Lab
          </h1>
          <span className={cn('text-[0.8rem] text-[#9cdcfe]', error && 'text-[#f48771]')}>
            {error ?? 'Ready'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 max-[900px]:flex-col max-[900px]:items-start">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Conversion mode">
            {converters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={modeId === item.id}
                className={cn(
                  'cursor-pointer rounded-full border border-[#3f3f3f] bg-[#2a2a2a] px-[0.65rem] py-[0.45rem] text-[0.75rem] leading-none text-[#a7a7a7] transition hover:bg-[#313131] hover:text-[#d8d8d8]',
                  modeId === item.id && 'border-[#2e6f65] bg-[#12342f] text-[#b7eee1]',
                )}
                onClick={() => setModeId(item.id)}
                title={item.description}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                'inline-flex cursor-pointer items-center gap-[0.35rem] rounded border border-[#4a4a4a] bg-[#2d2d2d] px-[0.55rem] py-[0.35rem] text-[0.8125rem] text-[#c8c8c8] hover:bg-[#3a3a3a]',
                autoConvert && 'border-[#2e6f65] bg-[#12342f] text-[#b7eee1] hover:bg-[#184239]',
              )}
              onClick={convert}
              title={autoConvert ? 'Auto convert is ON' : 'Run conversion'}
            >
              <WandSparkles size={14} aria-hidden="true" />
              Convert
            </button>

            <button
              type="button"
              className={cn(
                'inline-flex cursor-pointer items-center gap-[0.35rem] rounded border px-[0.55rem] py-[0.35rem] text-[0.8125rem]',
                clearConfirm
                  ? 'border-[#ab3737] bg-[#6c1f1f] text-[#ffd9d9] hover:bg-[#802525]'
                  : 'border-[#7a5252] bg-[#3b2727] text-[#f0c7c7] hover:bg-[#493131]',
              )}
              onClick={handleClearClick}
              title={clearConfirm ? 'Click again to confirm clear' : 'Prepare clear confirmation'}
            >
              <Eraser size={14} aria-hidden="true" />
              {clearConfirm ? 'Sure?' : 'Clear'}
            </button>

            <div className="relative" ref={settingsRef}>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-[0.35rem] rounded border border-[#4a4a4a] bg-[#2d2d2d] px-[0.45rem] py-[0.35rem] text-[0.8125rem] text-[#c8c8c8] hover:bg-[#3a3a3a]"
                onClick={() => setSettingsOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                title="Conversion settings"
              >
                <Settings size={14} aria-hidden="true" />
              </button>

              {settingsOpen && (
                <div
                  className="absolute top-[calc(100%+0.35rem)] right-0 z-[5] flex min-w-[12rem] flex-col gap-[0.55rem] rounded border border-[#444] bg-[#252526] p-[0.55rem] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                  role="menu"
                  aria-label="Settings"
                >
                  <label
                    className="inline-flex cursor-pointer items-center gap-[0.35rem] text-[0.8rem] text-[#bdbdbd]"
                    title="Convert as you type"
                  >
                    <input
                      type="checkbox"
                      checked={autoConvert}
                      onChange={(event) => setAutoConvert(event.target.checked)}
                    />
                    Auto convert
                  </label>

                  {canShowJsonQuotesToggle && (
                    <label
                      className="inline-flex cursor-pointer items-center gap-[0.35rem] text-[0.8rem] text-[#bdbdbd]"
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
                      className="flex flex-col items-start gap-[0.45rem] text-[0.8rem] text-[#bdbdbd]"
                      title="Choose quote style for JS string escaping"
                    >
                      <span>Quote style</span>
                      <div
                        className="inline-flex overflow-hidden rounded border border-[#454545]"
                        role="radiogroup"
                        aria-label="JavaScript quote style"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={jsQuote === 'double'}
                          className={cn(
                            'min-w-[1.8rem] cursor-pointer border-0 px-[0.45rem] py-[0.3rem] text-[0.8rem] leading-none text-[#c8c8c8]',
                            jsQuote === 'double' ? 'bg-[#3a3a3a] text-white' : 'bg-[#2d2d2d]',
                          )}
                          onClick={() => setJsQuote('double')}
                        >
                          &quot;
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={jsQuote === 'single'}
                          className={cn(
                            'min-w-[1.8rem] cursor-pointer border-0 border-l border-[#454545] px-[0.45rem] py-[0.3rem] text-[0.8rem] leading-none text-[#c8c8c8]',
                            jsQuote === 'single' ? 'bg-[#3a3a3a] text-white' : 'bg-[#2d2d2d]',
                          )}
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

      <div className="relative flex min-h-0 flex-1 bg-[#3c3c3c] max-[900px]:flex-col">
        <section className="flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-3 py-[0.4rem]">
            <span className="text-[0.8125rem] font-medium tracking-[0.04em] text-[#9dc3d8] uppercase">
              {inputLabel}
            </span>
            <div className="inline-flex items-center gap-[0.4rem]">
              <span className="text-[0.75rem] text-[#8f8f8f]">{getCharacterCount(input)}</span>
              <button
                type="button"
                className="inline-flex size-[1.6rem] cursor-pointer items-center justify-center rounded border border-[#4a4a4a] bg-[#2d2d2d] text-[#c8c8c8] transition hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-45"
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
          <div className="min-h-0 flex-1" title={inputLabel}>
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

        <div className="relative z-[2] w-4 shrink-0 border-r border-l border-[#474747] bg-[linear-gradient(to_right,#303033,#3c3c3c_50%,#303033)] max-[900px]:h-[14px] max-[900px]:w-full max-[900px]:border-x-0 max-[900px]:border-y max-[900px]:bg-[linear-gradient(to_bottom,#303033,#3c3c3c_50%,#303033)]">
          <button
            type="button"
            className="absolute top-1/2 left-1/2 inline-flex size-[2.1rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#2f5669] bg-[#223741] text-[#b6dff2] shadow-[0_0_0_2px_#1e1e1e] transition hover:bg-[#294450]"
            onClick={handleReverseFlow}
            title={`Reverse flow and swap panes (${flowText})`}
            aria-label="Reverse flow and swap panes"
          >
            <ArrowLeftRight size={16} aria-hidden="true" />
          </button>
        </div>

        <section className="flex min-w-0 flex-1 flex-col bg-[#1e1e1e]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-3 py-[0.4rem]">
            <span className="text-[0.8125rem] font-medium tracking-[0.04em] text-[#9dd8b7] uppercase">
              {outputLabel}
            </span>
            <div className="inline-flex items-center gap-[0.4rem]">
              <span className="text-[0.75rem] text-[#8f8f8f]">{getCharacterCount(output)}</span>
              <button
                type="button"
                className="inline-flex size-[1.6rem] cursor-pointer items-center justify-center rounded border border-[#4a4a4a] bg-[#2d2d2d] text-[#c8c8c8] transition hover:bg-[#3a3a3a] disabled:cursor-not-allowed disabled:opacity-45"
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
          <div className="min-h-0 flex-1" title={outputLabel}>
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
