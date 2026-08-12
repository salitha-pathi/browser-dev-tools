import {
  Blocks,
  Braces,
  FileText,
  type LucideIcon,
  MessageSquareText,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TabId } from '../types'

const LEFT_TABS: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: 'config', label: 'Config', icon: SlidersHorizontal },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'messages', label: 'Messages', icon: MessageSquareText },
  { id: 'tools', label: 'Tools', icon: Blocks },
  { id: 'payload', label: 'Payload', icon: Braces },
]

interface TabNavProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <div className="chat-completions__tabs" role="tablist" aria-label="Chat completion sections">
      <TabsList className="chat-completions__tabs-list">
        {LEFT_TABS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            active={activeTab === id}
            className="chat-completions__tab-trigger"
            onClick={() => onChange(id)}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </TabsTrigger>
        ))}

        <TabsTrigger
          role="tab"
          aria-selected={activeTab === 'response'}
          active={activeTab === 'response'}
          className="chat-completions__tab-trigger chat-completions__tab-trigger--rhs"
          onClick={() => onChange('response')}
        >
          <FileText size={14} aria-hidden="true" />
          Response
        </TabsTrigger>
      </TabsList>
    </div>
  )
}
