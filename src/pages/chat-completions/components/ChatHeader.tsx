import { AlertCircle, Check, Copy, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatHeaderProps {
  status: string
  statusTone: 'idle' | 'ok' | 'error'
  payloadCopied: boolean
  running: boolean
  blockingConfigIssueCount: number
  blockingIssueMessages: string[]
  onCopyPayload: () => void
  onRunRequest: () => void
}

export function ChatHeader({
  status,
  statusTone,
  payloadCopied,
  running,
  blockingConfigIssueCount,
  blockingIssueMessages,
  onCopyPayload,
  onRunRequest,
}: ChatHeaderProps) {
  const statusClass = cn(
    'chat-completions__status',
    statusTone === 'error' && 'chat-completions__status--error',
    statusTone === 'ok' && 'chat-completions__status--ok',
  )

  const tooltipText =
    blockingConfigIssueCount > 0
      ? `Cannot run yet:\n${blockingIssueMessages.map((issue) => `- ${issue}`).join('\n')}`
      : 'Ready to run. No blocking config issues.'

  return (
    <header className="chat-completions__header">
      <div className="chat-completions__title-wrap">
        <h1 className="chat-completions__title">
          <Sparkles size={16} aria-hidden="true" /> Chat Completions
        </h1>
        <span className={statusClass}>{status}</span>
      </div>
      <div className="chat-completions__header-actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="chat-completions__copy"
          onClick={onCopyPayload}
        >
          {payloadCopied ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
          Payload
        </Button>
        <div className="chat-completions__play-wrap">
          <Button
            type="button"
            size="sm"
            className="chat-completions__play"
            onClick={onRunRequest}
            disabled={running || blockingConfigIssueCount > 0}
            title={
              blockingConfigIssueCount > 0
                ? 'Fix config issues to enable request execution'
                : undefined
            }
          >
            <Play size={14} aria-hidden="true" />
            {running ? 'Running...' : 'Play'}
          </Button>

          <span
            className={`chat-completions__play-info ${
              blockingConfigIssueCount > 0 ? 'chat-completions__play-info--warn' : ''
            }`}
            tabIndex={0}
            role="note"
            aria-label={tooltipText}
          >
            <AlertCircle size={13} aria-hidden="true" />
            <span className="chat-completions__play-tooltip">{tooltipText}</span>
          </span>
        </div>
      </div>
    </header>
  )
}
