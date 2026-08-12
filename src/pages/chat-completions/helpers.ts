export function asNumber(raw: string, field: string): { value?: number; error?: string } {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return {}
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return { error: `${field} must be a valid number` }
  return { value: parsed }
}

export function asJsonValue<T>(raw: string, field: string): { value?: T; error?: string } {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return {}
  try {
    return { value: JSON.parse(trimmed) as T }
  } catch (error) {
    return { error: `${field} is invalid JSON: ${(error as Error).message}` }
  }
}

export function asInteger(raw: string, field: string): { value?: number; error?: string } {
  const number = asNumber(raw, field)
  if (number.error !== undefined || number.value === undefined) return number
  if (!Number.isInteger(number.value)) return { error: `${field} must be an integer` }
  return number
}

export function asJsonObject(
  raw: string,
  field: string,
): { value?: Record<string, unknown>; error?: string } {
  const parsed = asJsonValue<unknown>(raw, field)
  if (parsed.error !== undefined) return { error: parsed.error }
  if (parsed.value === undefined) return {}
  if (typeof parsed.value !== 'object' || parsed.value === null || Array.isArray(parsed.value)) {
    return { error: `${field} must be a JSON object` }
  }
  return { value: parsed.value as Record<string, unknown> }
}
