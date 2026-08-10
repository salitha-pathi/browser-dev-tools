import type { JsonChange } from './diff/types'

interface Counts {
  total: number
  added: number
  modified: number
  removed: number
}

function getCounts(changes: JsonChange[]): Counts {
  let added = 0
  let modified = 0
  let removed = 0

  for (const c of changes) {
    if (c.operation === 'add') added++
    else if (c.operation === 'replace') modified++
    else if (c.operation === 'remove') removed++
  }

  return { total: added + modified + removed, added, modified, removed }
}

interface Props {
  changes: JsonChange[] | null
}

export default function ChangeSummary({ changes }: Props) {
  if (!changes) {
    return (
      <div className="change-summary change-summary--invalid">
        Invalid JSON — fix errors to compare
      </div>
    )
  }

  if (changes.length === 0) {
    return <div className="change-summary change-summary--equal">No differences</div>
  }

  const { total, added, modified, removed } = getCounts(changes)

  return (
    <div className="change-summary">
      <span className="change-summary__total">
        {total} {total === 1 ? 'change' : 'changes'}
      </span>
      {added > 0 && <span className="change-summary__added">{added} added</span>}
      {modified > 0 && <span className="change-summary__modified">{modified} modified</span>}
      {removed > 0 && <span className="change-summary__removed">{removed} removed</span>}
    </div>
  )
}
