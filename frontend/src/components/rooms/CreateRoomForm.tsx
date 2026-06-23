import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, Textarea } from '@/components/common/FormControls'
import type { CreateRoomPayload } from '@/hooks/useRooms'

export function CreateRoomForm({ submitting, onCancel, onSubmit }: { submitting: boolean; onCancel: () => void; onSubmit: (data: CreateRoomPayload) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [maxMembers, setMaxMembers] = useState(10)

  function submit(event: FormEvent) {
    event.preventDefault()
    const subject_tags = tags.split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 10)
    onSubmit({ name: name.trim(), description: description.trim() || undefined, subject_tags, visibility, max_members: maxMembers })
  }

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Create a study room</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Set a clear purpose so the right students can join.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close create room form"><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="room-name">Room name</Label>
            <Input id="room-name" value={name} onChange={event => setName(event.target.value)} placeholder="DSA Evening Sprint" required minLength={2} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-tags">Subjects</Label>
            <Input id="room-tags" value={tags} onChange={event => setTags(event.target.value)} placeholder="DSA, Java, Algorithms" />
            <p className="text-xs text-muted-foreground">Comma-separated, up to 10 tags.</p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="room-description">Description</Label>
            <Textarea id="room-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="What will members study and how should sessions run?" maxLength={2000} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-visibility">Visibility</Label>
            <Select id="room-visibility" value={visibility} onChange={event => setVisibility(event.target.value as 'public' | 'private')}>
              <option value="public">Public — discoverable by everyone</option>
              <option value="private">Private — accessible with the direct link</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="room-capacity">Maximum members</Label>
            <Input id="room-capacity" type="number" min={2} max={50} value={maxMembers} onChange={event => setMaxMembers(Number(event.target.value))} />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={submitting || name.trim().length < 2}><Plus className="h-4 w-4" /> {submitting ? 'Creating…' : 'Create room'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
