import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { tools } from '@/config/tools'
import { cn } from '@/lib/utils'

/** Group tools by their category, preserving insertion order */
function groupByCategory(items: typeof tools) {
  const map = new Map<string, typeof tools>()
  for (const tool of items) {
    const group = map.get(tool.category) ?? []
    group.push(tool)
    map.set(tool.category, group)
  }
  return map
}

export default function Sidebar() {
  const groups = groupByCategory(tools)

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-white/[0.06] bg-[#161616]">
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Tools">
        {[...groups.entries()].map(([category, items]) => (
          <div key={category} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold tracking-widest text-white/25 uppercase select-none">
              {category}
            </p>
            <ul className="space-y-0.5">
              {items.map((tool) => (
                <li key={tool.id}>
                  <NavLink
                    to={tool.path}
                    title={tool.description}
                    className={({ isActive }) =>
                      cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-white/10 font-medium text-white'
                          : 'text-white/45 hover:bg-white/5 hover:text-white/75',
                      )
                    }
                  >
                    <span>{tool.label}</span>
                    {tool.badge && (
                      <Badge
                        variant="secondary"
                        className="h-4 shrink-0 border-0 bg-violet-500/20 px-1 text-[10px] text-violet-300"
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
