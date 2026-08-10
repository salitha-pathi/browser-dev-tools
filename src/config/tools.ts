export interface Tool {
  id: string
  label: string
  /** Full title used in the browser tab and page headings */
  title: string
  path: string
  description: string
  category: string
  badge?: string
}

export const tools: Tool[] = [
  {
    id: 'json-diff',
    label: 'JSON Diff',
    title: 'JSON Diff',
    path: '/json-diff',
    description: 'Compare two JSON documents and highlight semantic differences',
    category: 'Data',
  },
]
