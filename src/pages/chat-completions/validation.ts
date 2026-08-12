import { asInteger, asJsonObject, asJsonValue, asNumber } from './helpers'
import type { ChatConfigState, ConfigIssues } from './types'

export function getConfigIssues(cfg: ChatConfigState, toolsJson: string): ConfigIssues {
  const issues: ConfigIssues = {}

  const endpointTrimmed = cfg.endpoint.trim()
  if (endpointTrimmed.length === 0) {
    issues.endpoint = 'Endpoint is required.'
  } else {
    try {
      const parsed = new URL(endpointTrimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        issues.endpoint = 'Endpoint must start with http:// or https://'
      }
    } catch {
      issues.endpoint = 'Endpoint must be a valid URL.'
    }
  }

  if (cfg.model.trim().length === 0) {
    issues.model = 'Model is required.'
  }

  const temperature = asNumber(cfg.temperature, 'temperature')
  if (temperature.error !== undefined) {
    issues.temperature = temperature.error
  } else if (temperature.value !== undefined && (temperature.value < 0 || temperature.value > 2)) {
    issues.temperature = 'temperature must be between 0 and 2'
  }

  const topP = asNumber(cfg.topP, 'top_p')
  if (topP.error !== undefined) {
    issues.topP = topP.error
  } else if (topP.value !== undefined && (topP.value <= 0 || topP.value > 1)) {
    issues.topP = 'top_p must be > 0 and <= 1'
  }

  const n = asInteger(cfg.n, 'n')
  if (n.error !== undefined) {
    issues.n = n.error
  } else if (n.value !== undefined && n.value < 1) {
    issues.n = 'n must be at least 1'
  }

  const presencePenalty = asNumber(cfg.presencePenalty, 'presence_penalty')
  if (presencePenalty.error !== undefined) {
    issues.presencePenalty = presencePenalty.error
  } else if (
    presencePenalty.value !== undefined &&
    (presencePenalty.value < -2 || presencePenalty.value > 2)
  ) {
    issues.presencePenalty = 'presence_penalty must be between -2 and 2'
  }

  const frequencyPenalty = asNumber(cfg.frequencyPenalty, 'frequency_penalty')
  if (frequencyPenalty.error !== undefined) {
    issues.frequencyPenalty = frequencyPenalty.error
  } else if (
    frequencyPenalty.value !== undefined &&
    (frequencyPenalty.value < -2 || frequencyPenalty.value > 2)
  ) {
    issues.frequencyPenalty = 'frequency_penalty must be between -2 and 2'
  }

  const topLogprobs = asInteger(cfg.topLogprobs, 'top_logprobs')
  if (topLogprobs.error !== undefined) {
    issues.topLogprobs = topLogprobs.error
  } else if (topLogprobs.value !== undefined) {
    if (!cfg.logprobs) {
      issues.topLogprobs = 'Enable logprobs before setting top_logprobs'
    } else if (topLogprobs.value < 0 || topLogprobs.value > 20) {
      issues.topLogprobs = 'top_logprobs must be between 0 and 20'
    }
  }

  const maxTokens = asInteger(cfg.maxTokens, 'max_tokens')
  if (maxTokens.error !== undefined) {
    issues.maxTokens = maxTokens.error
  } else if (maxTokens.value !== undefined && maxTokens.value < 1) {
    issues.maxTokens = 'max_tokens must be at least 1'
  }

  const maxCompletionTokens = asInteger(cfg.maxCompletionTokens, 'max_completion_tokens')
  if (maxCompletionTokens.error !== undefined) {
    issues.maxCompletionTokens = maxCompletionTokens.error
  } else if (maxCompletionTokens.value !== undefined && maxCompletionTokens.value < 1) {
    issues.maxCompletionTokens = 'max_completion_tokens must be at least 1'
  }

  const maxInputTokens = asInteger(cfg.maxInputTokens, 'max_input_tokens')
  if (maxInputTokens.error !== undefined) {
    issues.maxInputTokens = maxInputTokens.error
  } else if (maxInputTokens.value !== undefined && maxInputTokens.value < 1) {
    issues.maxInputTokens = 'max_input_tokens must be at least 1'
  }

  if (cfg.maxTokens.trim().length > 0 && cfg.maxCompletionTokens.trim().length > 0) {
    issues.tokenChoice = 'Prefer one token limit. max_completion_tokens is the modern option.'
  }

  const seed = asInteger(cfg.seed, 'seed')
  if (seed.error !== undefined) {
    issues.seed = seed.error
  }

  if (cfg.toolChoiceMode === 'custom') {
    const toolChoice = asJsonObject(cfg.toolChoiceJson, 'tool_choice')
    if (toolChoice.error !== undefined) {
      issues.toolChoiceJson = toolChoice.error
    }
  }

  const tools = asJsonValue<unknown>(toolsJson, 'tools')
  if (tools.error !== undefined) {
    issues.toolSpecJson = tools.error
  } else if (tools.value !== undefined && !Array.isArray(tools.value)) {
    issues.toolSpecJson = 'tools must be a JSON array'
  }

  if (cfg.stream) {
    const streamOptions = asJsonObject(cfg.streamOptionsJson, 'stream_options')
    if (streamOptions.error !== undefined) {
      issues.streamOptionsJson = streamOptions.error
    }
  }

  const responseFormat = asJsonObject(cfg.responseFormatJson, 'response_format')
  if (responseFormat.error !== undefined) {
    issues.responseFormatJson = responseFormat.error
  }

  const stop = asJsonValue<unknown>(cfg.stopJson, 'stop')
  if (stop.error !== undefined) {
    issues.stopJson = stop.error
  } else if (stop.value !== undefined) {
    if (typeof stop.value !== 'string' && !Array.isArray(stop.value)) {
      issues.stopJson = 'stop must be a JSON string or a JSON string array'
    } else if (Array.isArray(stop.value) && stop.value.some((item) => typeof item !== 'string')) {
      issues.stopJson = 'stop array must contain only strings'
    }
  }

  const extraHeaders = asJsonObject(cfg.extraHeadersJson, 'extra_headers')
  if (extraHeaders.error !== undefined) {
    issues.extraHeadersJson = extraHeaders.error
  } else if (extraHeaders.value !== undefined) {
    const invalidHeader = Object.entries(extraHeaders.value).find(
      ([, value]) => typeof value !== 'string',
    )
    if (invalidHeader !== undefined) {
      issues.extraHeadersJson = 'Every extra_headers value must be a string'
    }
  }

  const extraBody = asJsonObject(cfg.extraBodyJson, 'extra_body')
  if (extraBody.error !== undefined) {
    issues.extraBodyJson = extraBody.error
  }

  return issues
}

export function getBlockingConfigIssueCount(configIssues: ConfigIssues): number {
  return Object.entries(configIssues).filter(([key]) => key !== 'tokenChoice').length
}
