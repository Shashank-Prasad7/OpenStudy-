import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function GoalForm({ submitting, onSubmit }: { submitting: boolean; onSubmit: (data: { title: string; deadline?: string | null }) => void }) {
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), deadline: deadline ? new Date(deadline).toISOString() : null })
    setTitle('')
    setDeadline('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New study goal</CardTitle>
        <p className="text-sm text-muted-foreground">Make it specific enough to finish in one or two sessions.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Goal</Label>
            <Input id="goal-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Complete two Java inheritance exercises" maxLength={180} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-deadline">Deadline</Label>
            <Input id="goal-deadline" type="datetime-local" value={deadline} onChange={event => setDeadline(event.target.value)} />
          </div>
          <Button type="submit" disabled={submitting || !title.trim()}><Plus className="h-4 w-4" /> {submitting ? 'Adding…' : 'Add goal'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
