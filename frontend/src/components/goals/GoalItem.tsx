import { CalendarDays, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import type { Goal } from '@/types'

export function GoalItem({ goal, busy, onToggle, onDelete }: { goal: Goal; busy: boolean; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        aria-label={goal.completed ? 'Mark goal incomplete' : 'Mark goal complete'}
        onClick={onToggle}
        disabled={busy}
        className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition', goal.completed ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-400' : 'border-white/15 bg-secondary/50 text-transparent hover:border-primary/60')}
      >
        <Check className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('font-semibold', goal.completed && 'text-muted-foreground line-through')}>{goal.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {goal.deadline ? `Due ${formatDate(goal.deadline)}` : `Created ${formatDate(goal.created_at)}`}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} disabled={busy} aria-label="Delete goal" className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
