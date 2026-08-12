import { decodeJsonStringContent, escapeJsonStringContent } from '@/utils/jsonString'

export type JsQuote = 'single' | 'double'

export interface ConvertContext {
  jsonIncludeQuotes: boolean
  jsQuote: JsQuote
}

export interface ConvertResult {
  output: string
  error?: string
}

export interface Converter {
  id: string
  label: string
  description: string
  escape: (input: string, context: ConvertContext) => ConvertResult
  unescape: (input: string, context: ConvertContext) => ConvertResult
}

function ok(output: string): ConvertResult {
  return { output }
}

function fail(error: string): ConvertResult {
  return { output: '', error }
}

function toUpperHex(value: number, width: number): string {
  return value.toString(16).toUpperCase().padStart(width, '0')
}

function decodePercent(input: string, modeLabel: string): ConvertResult {
  try {
    return ok(decodeURIComponent(input))
  } catch {
    return fail(`Invalid percent-encoding in ${modeLabel} input`)
  }
}

const XML_HTML_ENTITY_RE = /&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g

function decodeEntityToken(entity: string): string {
  if (entity === 'amp') return '&'
  if (entity === 'lt') return '<'
  if (entity === 'gt') return '>'
  if (entity === 'quot') return '"'
  if (entity === 'apos') return "'"

  if (entity.startsWith('#x')) {
    const value = Number.parseInt(entity.slice(2), 16)
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return `&${entity};`
    return String.fromCodePoint(value)
  }

  if (entity.startsWith('#')) {
    const value = Number.parseInt(entity.slice(1), 10)
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return `&${entity};`
    return String.fromCodePoint(value)
  }

  return `&${entity};`
}

function decodeEntities(input: string): string {
  return input.replace(XML_HTML_ENTITY_RE, (_match, entity: string) => decodeEntityToken(entity))
}

function escapeHtmlText(input: string): string {
  return input.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeHtmlAttribute(input: string): string {
  return escapeHtmlText(input).replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

function escapeXmlText(input: string): string {
  return escapeHtmlText(input)
}

function escapeJsString(input: string, quote: JsQuote): string {
  let out = ''

  for (const ch of input) {
    const codePoint = ch.codePointAt(0) ?? 0

    if (ch === '\\') out += '\\\\'
    else if (quote === 'double' && ch === '"') out += '\\"'
    else if (quote === 'single' && ch === "'") out += "\\'"
    else if (ch === '\b') out += '\\b'
    else if (ch === '\t') out += '\\t'
    else if (ch === '\n') out += '\\n'
    else if (ch === '\f') out += '\\f'
    else if (ch === '\r') out += '\\r'
    else if (codePoint <= 0x1f) out += `\\u${toUpperHex(codePoint, 4)}`
    else if (codePoint === 0x2028 || codePoint === 0x2029) out += `\\u${toUpperHex(codePoint, 4)}`
    else out += ch
  }

  return out
}

function isHex(value: string): boolean {
  return /^[0-9a-fA-F]+$/.test(value)
}

function unescapeJsString(input: string): ConvertResult {
  let out = ''

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]

    if (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029') {
      return fail('Raw line terminators are not valid in JavaScript string literal content')
    }

    if (ch !== '\\') {
      out += ch
      continue
    }

    i++
    if (i >= input.length) return fail('Trailing backslash in JavaScript escaped string')

    const esc = input[i]

    if (esc === '\\' || esc === '"' || esc === "'" || esc === '/') {
      out += esc
      continue
    }
    if (esc === 'b') {
      out += '\b'
      continue
    }
    if (esc === 'f') {
      out += '\f'
      continue
    }
    if (esc === 'n') {
      out += '\n'
      continue
    }
    if (esc === 'r') {
      out += '\r'
      continue
    }
    if (esc === 't') {
      out += '\t'
      continue
    }
    if (esc === 'v') {
      out += '\v'
      continue
    }
    if (esc === '0') {
      const next = input[i + 1]
      if (next !== undefined && /[0-9]/.test(next)) {
        return fail('Octal escapes are not supported')
      }
      out += '\0'
      continue
    }
    if (esc === 'x') {
      const hex = input.slice(i + 1, i + 3)
      if (hex.length !== 2 || !isHex(hex)) return fail('Invalid \\xHH escape')
      out += String.fromCodePoint(Number.parseInt(hex, 16))
      i += 2
      continue
    }
    if (esc === 'u') {
      if (input[i + 1] === '{') {
        const closeIndex = input.indexOf('}', i + 2)
        if (closeIndex === -1) return fail('Invalid \\u{...} escape: missing }')
        const hex = input.slice(i + 2, closeIndex)
        if (hex.length === 0 || hex.length > 6 || !isHex(hex))
          return fail('Invalid \\u{...} escape')
        const codePoint = Number.parseInt(hex, 16)
        if (codePoint > 0x10ffff) return fail('Code point out of range in \\u{...} escape')
        out += String.fromCodePoint(codePoint)
        i = closeIndex
        continue
      }

      const hex = input.slice(i + 1, i + 5)
      if (hex.length !== 4 || !isHex(hex)) return fail('Invalid \\uXXXX escape')
      out += String.fromCodePoint(Number.parseInt(hex, 16))
      i += 4
      continue
    }

    return fail(`Unsupported escape sequence \\${esc}`)
  }

  return ok(out)
}

function encodeBase64Utf8(input: string): ConvertResult {
  try {
    const bytes = new TextEncoder().encode(input)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return ok(btoa(binary))
  } catch (error) {
    return fail(`Failed to encode Base64: ${(error as Error).message}`)
  }
}

function decodeBase64Utf8(input: string): ConvertResult {
  try {
    const binary = atob(input)
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    const output = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return ok(output)
  } catch {
    return fail('Invalid Base64 input or invalid UTF-8 sequence')
  }
}

export const converters: Converter[] = [
  {
    id: 'json-string',
    label: 'JSON String Value',
    description: 'Escape and unescape string content for JSON string field values',
    escape: (input, context) => {
      const escaped = escapeJsonStringContent(input)
      return ok(context.jsonIncludeQuotes ? `"${escaped}"` : escaped)
    },
    unescape: (input) => {
      const decoded = decodeJsonStringContent(input)
      return decoded.error !== undefined ? fail(decoded.error) : ok(decoded.value ?? '')
    },
  },
  {
    id: 'url-component',
    label: 'URL Component',
    description: 'Encode/decode with encodeURIComponent rules',
    escape: (input) => ok(encodeURIComponent(input)),
    unescape: (input) => decodePercent(input, 'URL Component'),
  },
  {
    id: 'form-url-encoded',
    label: 'Form URL Encoded',
    description: 'application/x-www-form-urlencoded style with + for spaces',
    escape: (input) => ok(encodeURIComponent(input).replaceAll('%20', '+')),
    unescape: (input) => decodePercent(input.replaceAll('+', ' '), 'Form URL Encoded'),
  },
  {
    id: 'html-text',
    label: 'HTML Text',
    description: 'Escape text for HTML node content',
    escape: (input) => ok(escapeHtmlText(input)),
    unescape: (input) => ok(decodeEntities(input)),
  },
  {
    id: 'html-attribute',
    label: 'HTML Attribute',
    description: 'Escape text for HTML attribute values',
    escape: (input) => ok(escapeHtmlAttribute(input)),
    unescape: (input) => ok(decodeEntities(input)),
  },
  {
    id: 'xml-text',
    label: 'XML Text',
    description: 'Escape text for XML text nodes',
    escape: (input) => ok(escapeXmlText(input)),
    unescape: (input) => ok(decodeEntities(input)),
  },
  {
    id: 'js-string',
    label: 'JavaScript String Literal',
    description: 'Escape and unescape JavaScript string literal content',
    escape: (input, context) => ok(escapeJsString(input, context.jsQuote)),
    unescape: (input) => unescapeJsString(input),
  },
  {
    id: 'base64-utf8',
    label: 'Base64 UTF-8',
    description: 'Encode/decode UTF-8 text in Base64 form',
    escape: (input) => encodeBase64Utf8(input),
    unescape: (input) => decodeBase64Utf8(input),
  },
]
