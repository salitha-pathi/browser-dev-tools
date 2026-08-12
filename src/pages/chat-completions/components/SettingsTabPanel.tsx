import Editor from '@monaco-editor/react'
import { monacoJsonOptions } from '@/lib/monaco'
import type { ChatConfigState, ConfigIssues, UpdateConfig } from '../types'

function JsonEditorField({
  label,
  value,
  height,
  error,
  onChange,
}: {
  label: string
  value: string
  height: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="chat-completions__settings-json-wrap">
      <label className="chat-completions__settings-json-label">{label}</label>
      <div className="chat-completions__editor">
        <Editor
          language="json"
          value={value}
          theme="vs-dark"
          height={height}
          options={monacoJsonOptions}
          onChange={(v) => onChange(v ?? '')}
        />
      </div>
      {error !== undefined && <p className="chat-completions__field-error">{error}</p>}
    </div>
  )
}

interface SettingsTabPanelProps {
  cfg: ChatConfigState
  configIssues: ConfigIssues
  onUpdateConfig: UpdateConfig
}

export function SettingsTabPanel({ cfg, configIssues, onUpdateConfig }: SettingsTabPanelProps) {
  return (
    <section className="chat-completions__panel" role="tabpanel">
      <div className="chat-completions__config-layout">
        <section className="chat-completions__config-card">
          <h3>Execution</h3>

          <div className="chat-completions__config-subhead">Tracing</div>
          <div className="chat-completions__config-row chat-completions__config-row--double">
            <div className="chat-completions__field">
              <label htmlFor="cc-top-logprobs">top_logprobs</label>
              <input
                id="cc-top-logprobs"
                type="number"
                min="0"
                max="20"
                step="1"
                inputMode="numeric"
                value={cfg.topLogprobs}
                onChange={(event) => onUpdateConfig('topLogprobs', event.target.value)}
                disabled={!cfg.logprobs}
              />
              {configIssues.topLogprobs !== undefined && (
                <p className="chat-completions__field-error">{configIssues.topLogprobs}</p>
              )}
            </div>
          </div>

          <div className="chat-completions__config-subhead">Switches</div>
          <div className="chat-completions__settings-switch-grid">
            <label className="chat-completions__toggle">
              <input
                type="checkbox"
                checked={cfg.logprobs}
                onChange={(event) => onUpdateConfig('logprobs', event.target.checked)}
              />
              <span>Enable logprobs</span>
            </label>
            <label className="chat-completions__toggle">
              <input
                type="checkbox"
                checked={cfg.stream}
                onChange={(event) => onUpdateConfig('stream', event.target.checked)}
              />
              <span>Enable stream</span>
            </label>
            <label className="chat-completions__toggle">
              <input
                type="checkbox"
                checked={cfg.store}
                onChange={(event) => onUpdateConfig('store', event.target.checked)}
              />
              <span>Store completion</span>
            </label>
          </div>

          <fieldset className="chat-completions__settings-tier-group">
            <legend className="chat-completions__settings-tier-legend">service_tier</legend>
            <div className="chat-completions__settings-tier-grid">
              <label className="chat-completions__settings-tier-option">
                <input
                  type="radio"
                  name="cc-service-tier"
                  checked={cfg.serviceTier === 'auto'}
                  onChange={() => onUpdateConfig('serviceTier', 'auto')}
                />
                <span className="chat-completions__settings-tier-copy">
                  <strong>auto</strong>
                  <small>Provider decides balancing strategy.</small>
                </span>
              </label>
              <label className="chat-completions__settings-tier-option">
                <input
                  type="radio"
                  name="cc-service-tier"
                  checked={cfg.serviceTier === 'default'}
                  onChange={() => onUpdateConfig('serviceTier', 'default')}
                />
                <span className="chat-completions__settings-tier-copy">
                  <strong>default</strong>
                  <small>Stable default routing profile.</small>
                </span>
              </label>
              <label className="chat-completions__settings-tier-option">
                <input
                  type="radio"
                  name="cc-service-tier"
                  checked={cfg.serviceTier === 'flex'}
                  onChange={() => onUpdateConfig('serviceTier', 'flex')}
                />
                <span className="chat-completions__settings-tier-copy">
                  <strong>flex</strong>
                  <small>More dynamic resource allocation.</small>
                </span>
              </label>
              <label className="chat-completions__settings-tier-option">
                <input
                  type="radio"
                  name="cc-service-tier"
                  checked={cfg.serviceTier === 'scale'}
                  onChange={() => onUpdateConfig('serviceTier', 'scale')}
                />
                <span className="chat-completions__settings-tier-copy">
                  <strong>scale</strong>
                  <small>Throughput-oriented routing.</small>
                </span>
              </label>
              <label className="chat-completions__settings-tier-option">
                <input
                  type="radio"
                  name="cc-service-tier"
                  checked={cfg.serviceTier === 'priority'}
                  onChange={() => onUpdateConfig('serviceTier', 'priority')}
                />
                <span className="chat-completions__settings-tier-copy">
                  <strong>priority</strong>
                  <small>Lower latency, higher urgency path.</small>
                </span>
              </label>
              <label className="chat-completions__settings-tier-option">
                <input
                  type="radio"
                  name="cc-service-tier"
                  checked={cfg.serviceTier === 'fast'}
                  onChange={() => onUpdateConfig('serviceTier', 'fast')}
                />
                <span className="chat-completions__settings-tier-copy">
                  <strong>fast</strong>
                  <small>Speed-optimized best effort tier.</small>
                </span>
              </label>
            </div>
          </fieldset>

          {cfg.stream && (
            <JsonEditorField
              label="stream_options (JSON object)"
              value={cfg.streamOptionsJson}
              height="180px"
              error={configIssues.streamOptionsJson}
              onChange={(value) => onUpdateConfig('streamOptionsJson', value)}
            />
          )}
        </section>

        <section className="chat-completions__config-card">
          <h3>Identity And Caching</h3>
          <div className="chat-completions__config-row chat-completions__config-row--double">
            <div className="chat-completions__field">
              <label htmlFor="cc-safety-identifier">safety_identifier</label>
              <input
                id="cc-safety-identifier"
                value={cfg.safetyIdentifier}
                onChange={(event) => onUpdateConfig('safetyIdentifier', event.target.value)}
              />
            </div>
            <div className="chat-completions__field">
              <label htmlFor="cc-user">user (legacy)</label>
              <input
                id="cc-user"
                value={cfg.user}
                onChange={(event) => onUpdateConfig('user', event.target.value)}
              />
            </div>
          </div>

          <div className="chat-completions__config-row chat-completions__config-row--full">
            <div className="chat-completions__field chat-completions__field--full">
              <label htmlFor="cc-prompt-cache-key">prompt_cache_key</label>
              <input
                id="cc-prompt-cache-key"
                value={cfg.promptCacheKey}
                onChange={(event) => onUpdateConfig('promptCacheKey', event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="chat-completions__config-card">
          <h3>Advanced JSON</h3>

          <JsonEditorField
            label="response_format (JSON object)"
            value={cfg.responseFormatJson}
            height="180px"
            error={configIssues.responseFormatJson}
            onChange={(value) => onUpdateConfig('responseFormatJson', value)}
          />

          <JsonEditorField
            label="stop (JSON string or JSON string array)"
            value={cfg.stopJson}
            height="160px"
            error={configIssues.stopJson}
            onChange={(value) => onUpdateConfig('stopJson', value)}
          />

          <JsonEditorField
            label="extra_headers (JSON object)"
            value={cfg.extraHeadersJson}
            height="160px"
            error={configIssues.extraHeadersJson}
            onChange={(value) => onUpdateConfig('extraHeadersJson', value)}
          />

          <JsonEditorField
            label="extra_body (JSON object merged into payload)"
            value={cfg.extraBodyJson}
            height="180px"
            error={configIssues.extraBodyJson}
            onChange={(value) => onUpdateConfig('extraBodyJson', value)}
          />
        </section>
      </div>
    </section>
  )
}
