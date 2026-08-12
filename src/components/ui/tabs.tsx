import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const tabsListVariants = cva(
  'inline-flex w-full items-center gap-1 overflow-x-auto rounded-xl border border-border/60 bg-background/40 p-1',
)

const tabsTriggerVariants = cva(
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50',
  {
    variants: {
      active: {
        true: 'bg-secondary text-secondary-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.08)]',
        false: 'hover:bg-muted/60 hover:text-foreground',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
)

function TabsList({ className, ...props }: ButtonHTMLAttributes<HTMLDivElement>) {
  return <div data-slot="tabs-list" className={cn(tabsListVariants(), className)} {...props} />
}

interface TabsTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof tabsTriggerVariants> {
  active?: boolean
}

function TabsTrigger({ className, active = false, ...props }: TabsTriggerProps) {
  return (
    <button
      data-slot="tabs-trigger"
      type="button"
      data-state={active ? 'active' : 'inactive'}
      className={cn(tabsTriggerVariants({ active, className }))}
      {...props}
    />
  )
}

export { TabsList, TabsTrigger }
