export interface JsonStringDecodeResult {
  value?: string
  error?: string
}

function toUpperHex(value: number, width: number): string {
  return value.toString(16).toUpperCase().padStart(width, '0')
}

/**
 * Escape raw string content so it is safe inside a JSON string value.
 * Returns content only (no surrounding quotes).
 */
export function escapeJsonStringContent(input: string): string {
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    const ch = input[i]

    if (ch === '"') out += '\\"'
    else if (ch === '\\') out += '\\\\'
    else if (code === 0x08) out += '\\b'
    else if (code === 0x09) out += '\\t'
    else if (code === 0x0a) out += '\\n'
    else if (code === 0x0c) out += '\\f'
    else if (code === 0x0d) out += '\\r'
    else if (code <= 0x1f) out += `\\u${toUpperHex(code, 4)}`
    else out += ch
  }
  return out
}

/**
 * Decode JSON-escaped string content.
 * Accepts either bare escaped content or a full quoted JSON string.
 */
export function decodeJsonStringContent(input: string): JsonStringDecodeResult {
  const trimmed = input.trim()

  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    try {
      return { value: JSON.parse(trimmed) as string }
    } catch (error) {
      return { error: `Invalid quoted JSON string: ${(error as Error).message}` }
    }
  }

  try {
    return { value: JSON.parse(`"${input}"`) as string }
  } catch (error) {
    return { error: `Invalid JSON escaped string: ${(error as Error).message}` }
  }
}
