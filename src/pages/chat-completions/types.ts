export type TabId = 'config' | 'settings' | 'messages' | 'tools' | 'payload' | 'response'
export type Role = 'system' | 'user' | 'assistant' | 'tool' | 'developer'
export type ToolChoiceMode = 'auto' | 'none' | 'required' | 'custom'

export interface MessageRow {
  id: string
  role: Role
  content: string
  name: string
}

export interface ChatConfigState {
  endpoint: string
  apiKey: string
  model: string
  temperature: string
  topP: string
  n: string
  presencePenalty: string
  frequencyPenalty: string
  logprobs: boolean
  topLogprobs: string
  maxTokens: string
  maxCompletionTokens: string
  maxInputTokens: string
  stream: boolean
  streamOptionsJson: string
  toolChoiceMode: ToolChoiceMode
  toolChoiceJson: string
  parallelToolCalls: boolean
  store: boolean
  serviceTier: string
  safetyIdentifier: string
  promptCacheKey: string
  responseFormatJson: string
  stopJson: string
  user: string
  seed: string
  extraBodyJson: string
  extraHeadersJson: string
}

export const DEFAULT_CONFIG: ChatConfigState = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: '0.2',
  topP: '',
  n: '',
  presencePenalty: '',
  frequencyPenalty: '',
  logprobs: false,
  topLogprobs: '',
  maxTokens: '',
  maxCompletionTokens: '',
  maxInputTokens: '',
  stream: false,
  streamOptionsJson: '{\n  "include_usage": true\n}',
  toolChoiceMode: 'auto',
  toolChoiceJson: '{\n  "type": "function",\n  "function": { "name": "my_function" }\n}',
  parallelToolCalls: true,
  store: false,
  serviceTier: 'auto',
  safetyIdentifier: '',
  promptCacheKey: '',
  responseFormatJson: '',
  stopJson: '',
  user: '',
  seed: '',
  extraBodyJson: '',
  extraHeadersJson: '',
}

export const DEFAULT_MESSAGES: MessageRow[] = [
  {
    id: crypto.randomUUID(),
    role: 'user',
    content: 'Write a short greeting.',
    name: '',
  },
]

export type ConfigIssues = Record<string, string>

export type UpdateConfig = <K extends keyof ChatConfigState>(
  key: K,
  value: ChatConfigState[K],
) => void

export type UpdateMessage = <K extends keyof MessageRow>(
  id: string,
  key: K,
  value: MessageRow[K],
) => void

export function makeMessage(): MessageRow {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content: '',
    name: '',
  }
}
