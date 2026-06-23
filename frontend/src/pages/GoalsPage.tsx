import { useMemo, useState } from 'react'
import { BookOpenCheck, Target } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { EmptyState, ErrorPanel, LoadingPanel } from '@/components/common/AsyncState'
import { PageHeader } from '@/components/common/PageHeader'
import { GoalForm } from '@/components/goals/GoalForm'
import { GoalItem } from '@/components/goals/GoalItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateGoal, useDeleteGoal, useGoals, useSessionNotes, useToggleGoal } from '@/hooks/useGoals'
import { formatDate } from '@/lib/utils'

export default function GoalsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all')
  const goals = useGoals()
  const notes = useSessionNotes()
  const createGoal = useCreateGoal()
  const toggleGoal = useToggleGoal()
  const deleteGoal = useDeleteGoal()

  const filtered = useMemo(() => {
    const items = goals.data ?? []
    if (filter === 'open') return items.filter(goal => !goal.completed)
    if (filter === 'completed') return items.filter(goal => goal.completed)
    return items
  }, [filter, goals.data])

  async function handleCreate(data: Parameters<typeof createGoal.mutateAsync>[0]) {
    try {
      await createGoal.mutateAsync(data)
      toast.success('Goal added')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to add the goal'))
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    try {
      await toggleGoal.mutateAsync({ id, completed })
      toast.success(completed ? 'Goal completed — streak updated!' : 'Goal reopened')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to update the goal'))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal.mutateAsync(id)
      toast.success('Goal deleted')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to delete the goal'))
    }
  }

  return (
    <div>
      <PageHeader title="Goals & session notes" description="Set clear intentions, complete them honestly, and preserve a one-line record after every Pomodoro." />
      <GoalForm submitting={createGoal.isPending} onSubmit={data => void handleCreate(data)} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Your goals</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{goals.data?.filter(goal => goal.completed).length ?? 0} completed</p>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-secondary/30 p-1">
              {(['all', 'open', 'completed'] as const).map(value => (
                <Button key={value} size="sm" variant={filter === value ? 'default' : 'ghost'} onClick={() => setFilter(value)} className="capitalize">{value}</Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {goals.isLoading ? <LoadingPanel label="Loading goals…" /> : null}
            {goals.isError ? <ErrorPanel message={getApiError(goals.error)} onRetry={() => void goals.refetch()} /> : null}
            {!goals.isLoading && !goals.isError && filtered.length === 0 ? (
              <EmptyState icon={<Target className="h-6 w-6" />} title="No goals in this view" description="Add a focused goal above or switch the filter." />
            ) : null}
            <div className="space-y-3">
              {filtered.map(goal => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  busy={toggleGoal.isPending || deleteGoal.isPending}
                  onToggle={() => void handleToggle(goal.id, !goal.completed)}
                  onDelete={() => void handleDelete(goal.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-primary" /> Recent session notes</CardTitle>
            <p className="text-sm text-muted-foreground">Your post-Pomodoro learning log.</p>
          </CardHeader>
          <CardContent>
            {notes.isLoading ? <p className="text-sm text-muted-foreground">Loading notes…</p> : null}
            {notes.data?.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm leading-6 text-muted-foreground">Complete a Pomodoro in a room to add your first note.</p> : null}
            <div className="space-y-3">
              {notes.data?.slice(0, 8).map(note => (
                <div key={note.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm leading-6">{note.note_text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(note.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
