import { asInteger, asJsonObject, asJsonValue, asNumber } from './helpers'
import { DEFAULT_CONFIG } from './types'
import type { ChatConfigState, MessageRow } from './types'

interface BuildPayloadArgs {
  cfg: ChatConfigState
  messages: MessageRow[]
  toolsJson: string
  blockingConfigIssueCount: number
}

export function buildPayload({
  cfg,
  messages,
  toolsJson,
  blockingConfigIssueCount,
}: BuildPayloadArgs): { payload?: Record<string, unknown>; error?: string } {
  if (blockingConfigIssueCount > 0) {
    return { error: 'Fix the highlighted config issues before running the request' }
  }
  if (cfg.model.trim().length === 0) return { error: 'model is required' }
  if (messages.length === 0) return { error: 'At least one message is required' }

  const payload: Record<string, unknown> = {
    model: cfg.model.trim(),
    messages: messages.map((m) => {
      const row: Record<string, unknown> = {
        role: m.role,
        content: m.content,
      }
      if (m.name.trim().length > 0) row.name = m.name.trim()
      return row
    }),
    stream: cfg.stream,
    parallel_tool_calls: cfg.parallelToolCalls,
  }

  const temperature = asNumber(cfg.temperature, 'temperature')
  if (temperature.error) return { error: temperature.error }
  if (temperature.value !== undefined) {
    if (temperature.value < 0 || temperature.value > 2) {
      return { error: 'temperature must be between 0 and 2' }
    }
    payload.temperature = temperature.value
  }

  const topP = asNumber(cfg.topP, 'top_p')
  if (topP.error) return { error: topP.error }
  if (topP.value !== undefined) {
    if (topP.value <= 0 || topP.value > 1) {
      return { error: 'top_p must be > 0 and <= 1' }
    }
    payload.top_p = topP.value
  }

  const n = asInteger(cfg.n, 'n')
  if (n.error) return { error: n.error }
  if (n.value !== undefined) {
    if (n.value < 1) return { error: 'n must be at least 1' }
    payload.n = n.value
  }

  const presencePenalty = asNumber(cfg.presencePenalty, 'presence_penalty')
  if (presencePenalty.error) return { error: presencePenalty.error }
  if (presencePenalty.value !== undefined) {
    if (presencePenalty.value < -2 || presencePenalty.value > 2) {
      return { error: 'presence_penalty must be between -2 and 2' }
    }
    payload.presence_penalty = presencePenalty.value
  }

  const frequencyPenalty = asNumber(cfg.frequencyPenalty, 'frequency_penalty')
  if (frequencyPenalty.error) return { error: frequencyPenalty.error }
  if (frequencyPenalty.value !== undefined) {
    if (frequencyPenalty.value < -2 || frequencyPenalty.value > 2) {
      return { error: 'frequency_penalty must be between -2 and 2' }
    }
    payload.frequency_penalty = frequencyPenalty.value
  }

  if (cfg.logprobs) payload.logprobs = true

  const topLogprobs = asInteger(cfg.topLogprobs, 'top_logprobs')
  if (topLogprobs.error) return { error: topLogprobs.error }
  if (topLogprobs.value !== undefined) {
    if (!cfg.logprobs) return { error: 'top_logprobs requires logprobs=true' }
    if (topLogprobs.value < 0 || topLogprobs.value > 20) {
      return { error: 'top_logprobs must be between 0 and 20' }
    }
    payload.top_logprobs = topLogprobs.value
  }

  const maxTokens = asInteger(cfg.maxTokens, 'max_tokens')
  if (maxTokens.error) return { error: maxTokens.error }
  if (maxTokens.value !== undefined) {
    if (maxTokens.value < 1) return { error: 'max_tokens must be at least 1' }
    payload.max_tokens = maxTokens.value
  }

  const maxCompletionTokens = asInteger(cfg.maxCompletionTokens, 'max_completion_tokens')
  if (maxCompletionTokens.error) return { error: maxCompletionTokens.error }
  if (maxCompletionTokens.value !== undefined) {
    if (maxCompletionTokens.value < 1) {
      return { error: 'max_completion_tokens must be at least 1' }
    }
    payload.max_completion_tokens = maxCompletionTokens.value
  }

  const maxInputTokens = asInteger(cfg.maxInputTokens, 'max_input_tokens')
  if (maxInputTokens.error) return { error: maxInputTokens.error }
  if (maxInputTokens.value !== undefined) {
    if (maxInputTokens.value < 1) return { error: 'max_input_tokens must be at least 1' }
    payload.max_input_tokens = maxInputTokens.value
  }

  const seed = asInteger(cfg.seed, 'seed')
  if (seed.error) return { error: seed.error }
  if (seed.value !== undefined) payload.seed = seed.value

  if (cfg.stream) {
    const streamOptions = asJsonValue<Record<string, unknown>>(
      cfg.streamOptionsJson,
      'stream_options',
    )
    if (streamOptions.error) return { error: streamOptions.error }
    if (streamOptions.value !== undefined) payload.stream_options = streamOptions.value
  }

  const responseFormat = asJsonValue<Record<string, unknown>>(
    cfg.responseFormatJson,
    'response_format',
  )
  if (responseFormat.error) return { error: responseFormat.error }
  if (responseFormat.value !== undefined) payload.response_format = responseFormat.value

  const stop = asJsonValue<string[] | string>(cfg.stopJson, 'stop')
  if (stop.error) return { error: stop.error }
  if (stop.value !== undefined) payload.stop = stop.value

  if (cfg.toolChoiceMode !== 'custom') {
    payload.tool_choice = cfg.toolChoiceMode
  } else {
    const toolChoice = asJsonValue<Record<string, unknown>>(cfg.toolChoiceJson, 'tool_choice')
    if (toolChoice.error) return { error: toolChoice.error }
    if (toolChoice.value !== undefined) payload.tool_choice = toolChoice.value
  }

  const tools = asJsonValue<unknown[]>(toolsJson, 'tools')
  if (tools.error) return { error: tools.error }
  if (tools.value !== undefined && tools.value.length > 0) payload.tools = tools.value

  if (cfg.user.trim().length > 0) payload.user = cfg.user.trim()
  if (cfg.safetyIdentifier.trim().length > 0)
    payload.safety_identifier = cfg.safetyIdentifier.trim()
  if (cfg.promptCacheKey.trim().length > 0) payload.prompt_cache_key = cfg.promptCacheKey.trim()
  if (cfg.store) payload.store = true
  if (cfg.serviceTier.trim().length > 0) payload.service_tier = cfg.serviceTier.trim()

  const extraBody = asJsonValue<Record<string, unknown>>(cfg.extraBodyJson, 'extra_body')
  if (extraBody.error) return { error: extraBody.error }
  if (extraBody.value !== undefined) {
    for (const [key, value] of Object.entries(extraBody.value)) payload[key] = value
  }

  return { payload }
}

export function parsePayloadIntoState(payloadText: string): {
  error?: string
  config?: ChatConfigState
  messages?: MessageRow[]
  toolsJson?: string
} {
  const parsed = asJsonObject(payloadText, 'payload')
  if (parsed.error !== undefined || parsed.value === undefined) {
    return { error: parsed.error ?? 'Payload is required' }
  }

  const body = parsed.value
  const merged: ChatConfigState = { ...DEFAULT_CONFIG }

  if (typeof body.model === 'string') merged.model = body.model
  if (typeof body.stream === 'boolean') merged.stream = body.stream
  if (typeof body.parallel_tool_calls === 'boolean')
    merged.parallelToolCalls = body.parallel_tool_calls
  if (typeof body.temperature === 'number') merged.temperature = String(body.temperature)
  if (typeof body.top_p === 'number') merged.topP = String(body.top_p)
  if (typeof body.n === 'number') merged.n = String(body.n)
  if (typeof body.presence_penalty === 'number')
    merged.presencePenalty = String(body.presence_penalty)
  if (typeof body.frequency_penalty === 'number')
    merged.frequencyPenalty = String(body.frequency_penalty)
  if (typeof body.logprobs === 'boolean') merged.logprobs = body.logprobs
  if (typeof body.top_logprobs === 'number') merged.topLogprobs = String(body.top_logprobs)
  if (typeof body.max_tokens === 'number') merged.maxTokens = String(body.max_tokens)
  if (typeof body.max_completion_tokens === 'number')
    merged.maxCompletionTokens = String(body.max_completion_tokens)
  if (typeof body.max_input_tokens === 'number')
    merged.maxInputTokens = String(body.max_input_tokens)
  if (typeof body.seed === 'number') merged.seed = String(body.seed)

  if (body.stream_options !== undefined)
    merged.streamOptionsJson = JSON.stringify(body.stream_options, null, 2)
  if (body.response_format !== undefined)
    merged.responseFormatJson = JSON.stringify(body.response_format, null, 2)
  if (body.stop !== undefined) merged.stopJson = JSON.stringify(body.stop, null, 2)

  if (typeof body.tool_choice === 'string') {
    if (
      body.tool_choice === 'auto' ||
      body.tool_choice === 'none' ||
      body.tool_choice === 'required'
    ) {
      merged.toolChoiceMode = body.tool_choice
    }
  } else if (
    typeof body.tool_choice === 'object' &&
    body.tool_choice !== null &&
    !Array.isArray(body.tool_choice)
  ) {
    merged.toolChoiceMode = 'custom'
    merged.toolChoiceJson = JSON.stringify(body.tool_choice, null, 2)
  }

  if (typeof body.user === 'string') merged.user = body.user
  if (typeof body.safety_identifier === 'string') merged.safetyIdentifier = body.safety_identifier
  if (typeof body.prompt_cache_key === 'string') merged.promptCacheKey = body.prompt_cache_key
  if (typeof body.store === 'boolean') merged.store = body.store
  if (typeof body.service_tier === 'string') merged.serviceTier = body.service_tier

  const knownKeys = new Set([
    'model',
    'messages',
    'stream',
    'parallel_tool_calls',
    'temperature',
    'top_p',
    'n',
    'presence_penalty',
    'frequency_penalty',
    'logprobs',
    'top_logprobs',
    'max_tokens',
    'max_completion_tokens',
    'max_input_tokens',
    'seed',
    'stream_options',
    'response_format',
    'stop',
    'tool_choice',
    'tools',
    'user',
    'safety_identifier',
    'prompt_cache_key',
    'store',
    'service_tier',
  ])

  const extraBodyEntries = Object.entries(body).filter(([key]) => !knownKeys.has(key))
  merged.extraBodyJson =
    extraBodyEntries.length > 0 ? JSON.stringify(Object.fromEntries(extraBodyEntries), null, 2) : ''

  const nextMessages: MessageRow[] | undefined = Array.isArray(body.messages)
    ? body.messages
        .map((message) => {
          if (typeof message !== 'object' || message === null || Array.isArray(message)) {
            return null
          }
          const role =
            typeof message.role === 'string' &&
            (message.role === 'system' ||
              message.role === 'developer' ||
              message.role === 'user' ||
              message.role === 'assistant' ||
              message.role === 'tool')
              ? message.role
              : 'user'

          const content =
            typeof message.content === 'string'
              ? message.content
              : message.content === undefined
                ? ''
                : JSON.stringify(message.content, null, 2)

          return {
            id: crypto.randomUUID(),
            role,
            content,
            name: typeof message.name === 'string' ? message.name : '',
          } as MessageRow
        })
        .filter((message): message is MessageRow => message !== null)
    : undefined

  const parsedToolsJson = Array.isArray(body.tools)
    ? JSON.stringify(body.tools, null, 2)
    : undefined

  return {
    config: merged,
    messages: nextMessages,
    toolsJson: parsedToolsJson,
  }
}
