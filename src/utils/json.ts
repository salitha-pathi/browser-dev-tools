export interface ParseResult {
  data: unknown
  error?: string
}

export function parseJson(text: string): ParseResult {
  try {
    return { data: JSON.parse(text) }
  } catch (e) {
    return { data: undefined, error: (e as Error).message }
  }
}

export function formatJson(text: string): string {
  const result = parseJson(text)
  if (result.error !== undefined) return text
  return JSON.stringify(result.data, null, 2)
}
