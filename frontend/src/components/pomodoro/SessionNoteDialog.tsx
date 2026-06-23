import { useState, type FormEvent } from 'react'
import { BookOpenCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/common/FormControls'

export function SessionNoteDialog({ open, saving, onClose, onSave }: { open: boolean; saving: boolean; onClose: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState('')
  if (!open) return null

  function submit(event: FormEvent) {
    event.preventDefault()
    if (note.trim()) onSave(note.trim())
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="session-note-title">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400"><BookOpenCheck className="h-5 w-5" /></div>
            <div>
              <h2 id="session-note-title" className="text-xl font-black">Focus session complete</h2>
              <p className="mt-1 text-sm text-muted-foreground">Capture one line so future you remembers the progress.</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
        </div>
        <div className="mt-6 space-y-2">
          <Label htmlFor="session-note">What did you study?</Label>
          <Textarea id="session-note" autoFocus value={note} onChange={event => setNote(event.target.value)} maxLength={240} placeholder="Solved graph traversal problems and reviewed BFS complexity." />
          <p className="text-right text-xs text-muted-foreground">{note.length}/240</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Skip</Button>
          <Button type="submit" disabled={saving || !note.trim()}>{saving ? 'Saving…' : 'Save note'}</Button>
        </div>
      </form>
    </div>
  )
}
