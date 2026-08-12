import { Plus, Settings2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { useConfirmAction } from '@/hooks/useConfirmAction'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { MessageRow, UpdateMessage } from '../types'

const MESSAGE_ROLE_OPTIONS: MessageRow['role'][] = [
  'system',
  'developer',
  'user',
  'assistant',
  'tool',
]

const messageEditorOptions = {
  minimap: { enabled: false },
  automaticLayout: true,
  fontSize: 13,
  lineNumbers: 'on' as const,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 10,
  readOnly: false,
  domReadOnly: false,
  padding: { top: 10, bottom: 10 },
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
}

interface MessagesTabPanelProps {
  messages: MessageRow[]
  onAddMessage: () => void
  onRemoveMessage: (id: string) => void
  onUpdateMessage: UpdateMessage
  onTransformMessage: (id: string, mode: 'escape' | 'unescape') => void
}

export function MessagesTabPanel({
  messages,
  onAddMessage,
  onRemoveMessage,
  onUpdateMessage,
  onTransformMessage,
}: MessagesTabPanelProps) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(messages[0]?.id ?? null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const deleteConfirm = useConfirmAction()
  const gearWrapRef = useRef<HTMLDivElement | null>(null)
  useClickOutside(gearWrapRef, () => setOpenMenuId(null), openMenuId !== null)

  const activeMessage = messages.find((message) => message.id === activeMessageId) ?? null
  const activeMessageIndex = activeMessage
    ? messages.findIndex((message) => message.id === activeMessage.id)
    : -1

  useEffect(() => {
    if (messages.length === 0) {
      setActiveMessageId(null)
      deleteConfirm.disarm()
      setOpenMenuId(null)
      return
    }

    if (activeMessageId === null || !messages.some((message) => message.id === activeMessageId)) {
      setActiveMessageId(messages[0].id)
    }

    if (
      deleteConfirm.armedId !== null &&
      !messages.some((message) => message.id === deleteConfirm.armedId)
    ) {
      deleteConfirm.disarm()
    }

    if (openMenuId !== null && !messages.some((message) => message.id === openMenuId)) {
      setOpenMenuId(null)
    }
  }, [activeMessageId, deleteConfirm, messages, openMenuId])

  useEffect(() => {
    if (openMenuId === null) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openMenuId])

  const onDeleteClick = (id: string) => {
    if (messages.length === 1) return
    if (!deleteConfirm.arm(id)) return
    if (activeMessageId === id) {
      const currentIndex = messages.findIndex((message) => message.id === id)
      const fallbackId = messages[currentIndex + 1]?.id ?? messages[currentIndex - 1]?.id ?? null
      setActiveMessageId(fallbackId)
    }
    onRemoveMessage(id)
    setOpenMenuId((current) => (current === id ? null : current))
  }

  const toggleMessageMenu = (id: string) => {
    setOpenMenuId((current) => (current === id ? null : id))
  }

  return (
    <section className="chat-completions__panel" role="tabpanel">
      <div className="chat-completions__messages-workbench">
        <aside className="chat-completions__messages-sidebar" aria-label="Messages list">
          <div className="chat-completions__messages-sidebar-head">
            <h3>Messages</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="chat-completions__small-btn"
              onClick={onAddMessage}
            >
              <Plus size={12} aria-hidden="true" /> Add
            </Button>
          </div>

          <div
            className="chat-completions__messages-sidebar-list"
            role="tablist"
            aria-orientation="vertical"
          >
            {messages.map((message, index) => {
              const isActive = message.id === activeMessageId
              const nameLabel = message.name.trim().length > 0 ? message.name.trim() : 'unnamed'

              return (
                <button
                  key={message.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`chat-completions__message-tab ${isActive ? 'chat-completions__message-tab--active' : ''}`}
                  onClick={() => setActiveMessageId(message.id)}
                  title={`Message #${index + 1}`}
                >
                  <span className="chat-completions__message-tab-role">{message.role}</span>
                  <span className="chat-completions__message-tab-name">{nameLabel}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="chat-completions__messages-detail" role="tabpanel">
          {activeMessage !== null ? (
            <article className="chat-completions__message" key={activeMessage.id}>
              <div className="chat-completions__message-head">
                <div className="chat-completions__message-meta">
                  <span className="chat-completions__message-index">
                    Message #{activeMessageIndex + 1}
                  </span>
                </div>
                <div className="chat-completions__message-row">
                  <div className="chat-completions__message-controls">
                    <label
                      className="chat-completions__message-label"
                      htmlFor={`cc-message-role-${activeMessage.id}`}
                    >
                      Role
                    </label>
                    <select
                      id={`cc-message-role-${activeMessage.id}`}
                      value={activeMessage.role}
                      onChange={(event) =>
                        onUpdateMessage(
                          activeMessage.id,
                          'role',
                          event.target.value as MessageRow['role'],
                        )
                      }
                    >
                      {MESSAGE_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <label
                      className="chat-completions__message-label"
                      htmlFor={`cc-message-name-${activeMessage.id}`}
                    >
                      Name
                    </label>
                    <input
                      id={`cc-message-name-${activeMessage.id}`}
                      value={activeMessage.name}
                      placeholder="optional"
                      onChange={(event) =>
                        onUpdateMessage(activeMessage.id, 'name', event.target.value)
                      }
                    />
                  </div>

                  <div className="chat-completions__actions">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className={`chat-completions__small-btn chat-completions__small-btn--danger ${
                        deleteConfirm.armedId === activeMessage.id
                          ? 'chat-completions__small-btn--armed'
                          : ''
                      }`}
                      onClick={() => onDeleteClick(activeMessage.id)}
                      disabled={messages.length === 1}
                      title={
                        messages.length === 1
                          ? 'At least one message is required'
                          : deleteConfirm.armedId === activeMessage.id
                            ? 'Click again to confirm delete'
                            : 'Prepare delete confirmation'
                      }
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {deleteConfirm.armedId === activeMessage.id ? 'Sure?' : 'Delete'}
                    </Button>

                    <div className="chat-completions__message-gear-wrap" ref={gearWrapRef}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="chat-completions__small-btn chat-completions__message-gear-btn"
                        title="More actions"
                        aria-label="More actions"
                        aria-haspopup="menu"
                        aria-controls={`cc-message-menu-${activeMessage.id}`}
                        aria-expanded={openMenuId === activeMessage.id}
                        onClick={() => toggleMessageMenu(activeMessage.id)}
                      >
                        <Settings2 size={14} aria-hidden="true" />
                      </Button>

                      {openMenuId === activeMessage.id && (
                        <div
                          id={`cc-message-menu-${activeMessage.id}`}
                          className="chat-completions__message-gear-menu"
                          role="menu"
                          aria-label="Message actions"
                        >
                          <button
                            type="button"
                            className="chat-completions__message-menu-action"
                            role="menuitem"
                            onClick={() => {
                              onTransformMessage(activeMessage.id, 'escape')
                              setOpenMenuId(null)
                            }}
                            title="Convert content into JSON-escaped text"
                          >
                            Escape
                          </button>
                          <button
                            type="button"
                            className="chat-completions__message-menu-action"
                            role="menuitem"
                            onClick={() => {
                              onTransformMessage(activeMessage.id, 'unescape')
                              setOpenMenuId(null)
                            }}
                            title="Convert escaped JSON text back to readable text"
                          >
                            Unescape
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="chat-completions__message-editor-wrap">
                <label className="chat-completions__message-editor-label">Content</label>
                <div className="chat-completions__editor chat-completions__editor--message-content">
                  <Editor
                    key={activeMessage.id}
                    language="plaintext"
                    value={activeMessage.content}
                    height="100%"
                    theme="vs-dark"
                    options={messageEditorOptions}
                    onMount={(editor) => {
                      editor.layout()
                    }}
                    onChange={(value) => onUpdateMessage(activeMessage.id, 'content', value ?? '')}
                  />
                </div>
              </div>
            </article>
          ) : (
            <div className="chat-completions__response-empty">No messages available.</div>
          )}
        </section>
      </div>
    </section>
  )
}
