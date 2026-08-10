export type JsonChangeOperation = 'add' | 'remove' | 'replace'

/** 0-based line/column, matching json-source-map's coordinate system */
export interface SourceRange {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
}

export interface JsonSourceLocation {
  key?: SourceRange
  value: SourceRange
  /** Spans from key start to value end; undefined for root or array items without a key */
  property?: SourceRange
}

export interface JsonChange {
  operation: JsonChangeOperation
  path: string
  original?: JsonSourceLocation
  modified?: JsonSourceLocation
  oldValue?: unknown
  newValue?: unknown
}
