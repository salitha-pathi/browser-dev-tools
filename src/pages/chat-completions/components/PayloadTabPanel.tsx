import { Check, Circle, Play, RefreshCw } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { monacoJsonOptions } from '@/lib/monaco'

interface PayloadTabPanelProps {
  payloadEdited: boolean
  payloadParseError: string | null
  payloadText: string
  payloadCopied: boolean
  onResetPayloadEditor: () => void
  onGenerateFormFromPayload: () => void
  onPayloadTextChange: (value: string) => void
}

export function PayloadTabPanel({
  payloadEdited,
  payloadParseError,
  payloadText,
  payloadCopied,
  onResetPayloadEditor,
  onGenerateFormFromPayload,
  onPayloadTextChange,
}: PayloadTabPanelProps) {
  return (
    <section className="chat-completions__panel" role="tabpanel">
      <section className="chat-completions__config-card">
        <div className="chat-completions__payload-head">
          <h3>Payload Sync</h3>
          <div className="chat-completions__payload-head-actions">
            <span
              className={`chat-completions__payload-sync-icon ${
                payloadEdited ? '' : 'chat-completions__payload-sync-icon--ok'
              }`}
              title={payloadEdited ? 'Out of sync with form values' : 'In sync with form values'}
              aria-label={
                payloadEdited ? 'Out of sync with form values' : 'In sync with form values'
              }
            >
              {payloadEdited ? (
                <Circle size={12} aria-hidden="true" />
              ) : (
                <Check size={13} aria-hidden="true" />
              )}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              title="Sync from form to payload editor"
              onClick={onResetPayloadEditor}
            >
              <RefreshCw size={14} aria-hidden="true" />
              Reset
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              title="Generate form values from payload editor"
              onClick={onGenerateFormFromPayload}
            >
              <Play size={14} aria-hidden="true" />
              Generate
            </Button>
            {payloadCopied && (
              <span className="chat-completions__copied-inline" title="Payload copied">
                <Check size={14} aria-hidden="true" /> Copied
              </span>
            )}
          </div>
        </div>

        <div className="chat-completions__payload-editor-wrap">
          <label className="chat-completions__payload-editor-label">JSON body</label>
          <div className="chat-completions__editor chat-completions__editor--payload">
            <Editor
              language="json"
              value={payloadText}
              theme="vs-dark"
              height="100%"
              options={monacoJsonOptions}
              onChange={(value) => onPayloadTextChange(value ?? '')}
            />
          </div>
        </div>

        {payloadParseError !== null && (
          <p className="chat-completions__field-error">{payloadParseError}</p>
        )}
      </section>
    </section>
  )
}
