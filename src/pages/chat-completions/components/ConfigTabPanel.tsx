import type { ReactNode } from 'react'
import type { ChatConfigState, ConfigIssues, UpdateConfig } from '../types'

function ConfigField({
  id,
  label,
  error,
  full,
  children,
}: {
  id: string
  label: string
  error?: string
  full?: boolean
  children: ReactNode
}) {
  return (
    <div className={`chat-completions__field${full ? 'chat-completions__field--full' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error !== undefined && <p className="chat-completions__field-error">{error}</p>}
    </div>
  )
}

interface ConfigTabPanelProps {
  cfg: ChatConfigState
  configIssues: ConfigIssues
  onUpdateConfig: UpdateConfig
}

export function ConfigTabPanel({ cfg, configIssues, onUpdateConfig }: ConfigTabPanelProps) {
  return (
    <section className="chat-completions__panel" role="tabpanel">
      <div className="chat-completions__config-layout">
        <section className="chat-completions__config-card">
          <h3>Connection</h3>
          <div className="chat-completions__config-row chat-completions__config-row--full">
            <ConfigField id="cc-endpoint" label="Endpoint" error={configIssues.endpoint} full>
              <input
                id="cc-endpoint"
                value={cfg.endpoint}
                onChange={(event) => onUpdateConfig('endpoint', event.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
              />
            </ConfigField>
          </div>

          <div className="chat-completions__config-row chat-completions__config-row--full">
            <ConfigField id="cc-api-key" label="API Key (Bearer token)" full>
              <input
                id="cc-api-key"
                type="password"
                value={cfg.apiKey}
                onChange={(event) => onUpdateConfig('apiKey', event.target.value)}
                placeholder="sk-..."
              />
            </ConfigField>
          </div>

          <div className="chat-completions__config-row">
            <ConfigField id="cc-model" label="Model" error={configIssues.model}>
              <input
                id="cc-model"
                value={cfg.model}
                onChange={(event) => onUpdateConfig('model', event.target.value)}
                placeholder="gpt-4o-mini"
              />
            </ConfigField>
          </div>
        </section>

        <section className="chat-completions__config-card">
          <h3>Sampling And Limits</h3>

          <div className="chat-completions__config-subhead">Sampling</div>
          <div className="chat-completions__config-row chat-completions__config-row--quad">
            <ConfigField id="cc-temperature" label="temperature" error={configIssues.temperature}>
              <input
                id="cc-temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                inputMode="decimal"
                value={cfg.temperature}
                onChange={(event) => onUpdateConfig('temperature', event.target.value)}
              />
            </ConfigField>
            <ConfigField id="cc-top-p" label="top_p" error={configIssues.topP}>
              <input
                id="cc-top-p"
                type="number"
                min="0"
                max="1"
                step="0.05"
                inputMode="decimal"
                value={cfg.topP}
                onChange={(event) => onUpdateConfig('topP', event.target.value)}
              />
            </ConfigField>
            <ConfigField
              id="cc-presence-penalty"
              label="presence_penalty"
              error={configIssues.presencePenalty}
            >
              <input
                id="cc-presence-penalty"
                type="number"
                min="-2"
                max="2"
                step="0.1"
                inputMode="decimal"
                value={cfg.presencePenalty}
                onChange={(event) => onUpdateConfig('presencePenalty', event.target.value)}
              />
            </ConfigField>
            <ConfigField
              id="cc-frequency-penalty"
              label="frequency_penalty"
              error={configIssues.frequencyPenalty}
            >
              <input
                id="cc-frequency-penalty"
                type="number"
                min="-2"
                max="2"
                step="0.1"
                inputMode="decimal"
                value={cfg.frequencyPenalty}
                onChange={(event) => onUpdateConfig('frequencyPenalty', event.target.value)}
              />
            </ConfigField>
          </div>

          <div className="chat-completions__config-subhead">Generation</div>
          <div className="chat-completions__config-row chat-completions__config-row--triple">
            <ConfigField id="cc-n" label="n" error={configIssues.n}>
              <input
                id="cc-n"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={cfg.n}
                onChange={(event) => onUpdateConfig('n', event.target.value)}
              />
            </ConfigField>
            <ConfigField id="cc-seed" label="seed" error={configIssues.seed}>
              <input
                id="cc-seed"
                type="number"
                step="1"
                inputMode="numeric"
                value={cfg.seed}
                onChange={(event) => onUpdateConfig('seed', event.target.value)}
              />
            </ConfigField>
            <ConfigField
              id="cc-max-completion-tokens"
              label="max_completion_tokens"
              error={configIssues.maxCompletionTokens}
            >
              <input
                id="cc-max-completion-tokens"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={cfg.maxCompletionTokens}
                onChange={(event) => onUpdateConfig('maxCompletionTokens', event.target.value)}
              />
            </ConfigField>
          </div>

          <div className="chat-completions__config-subhead">
            Legacy / Compatibility Token Limits
          </div>
          <div className="chat-completions__config-row chat-completions__config-row--double">
            <ConfigField
              id="cc-max-tokens"
              label="max_tokens (legacy)"
              error={configIssues.maxTokens}
            >
              <input
                id="cc-max-tokens"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={cfg.maxTokens}
                onChange={(event) => onUpdateConfig('maxTokens', event.target.value)}
              />
            </ConfigField>
            <ConfigField
              id="cc-max-input-tokens"
              label="max_input_tokens (compat)"
              error={configIssues.maxInputTokens}
            >
              <input
                id="cc-max-input-tokens"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={cfg.maxInputTokens}
                onChange={(event) => onUpdateConfig('maxInputTokens', event.target.value)}
              />
            </ConfigField>
          </div>
          {configIssues.tokenChoice !== undefined && (
            <p className="chat-completions__field-warning">{configIssues.tokenChoice}</p>
          )}
        </section>
      </div>
    </section>
  )
}
