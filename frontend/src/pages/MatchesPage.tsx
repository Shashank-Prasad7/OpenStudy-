import { useState, type FormEvent } from 'react'
import { SlidersHorizontal, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { EmptyState, ErrorPanel, LoadingPanel } from '@/components/common/AsyncState'
import { PageHeader } from '@/components/common/PageHeader'
import { Select } from '@/components/common/FormControls'
import { PartnerCard } from '@/components/matching/PartnerCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAcceptMatch, useMatches } from '@/hooks/useMatches'
import { usePreferences, useUpdatePreferences } from '@/hooks/useUser'
import type { Preference } from '@/types'

interface PreferenceDraft {
  subjects: string[]
  study_time: Preference['study_time']
  style: Preference['style']
}

function PreferencesForm({ initial, saving, onSave }: { initial: Preference | null | undefined; saving: boolean; onSave: (draft: PreferenceDraft) => Promise<void> }) {
  const [subjects, setSubjects] = useState(initial?.subjects.join(', ') ?? '')
  const [studyTime, setStudyTime] = useState<Preference['study_time']>(initial?.study_time ?? 'evening')
  const [style, setStyle] = useState<Preference['style']>(initial?.style ?? 'mix')

  async function submit(event: FormEvent) {
    event.preventDefault()
    await onSave({
      subjects: subjects.split(',').map(subject => subject.trim()).filter(Boolean).slice(0, 20),
      study_time: studyTime,
      style,
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_200px_200px_auto] md:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="subjects">Subjects</Label>
        <Input id="subjects" value={subjects} onChange={event => setSubjects(event.target.value)} placeholder="Java, DSA, Mathematics" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="study-time">Study time</Label>
        <Select id="study-time" value={studyTime} onChange={event => setStudyTime(event.target.value as Preference['study_time'])}>
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
          <option value="night">Night</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="study-style">Study style</Label>
        <Select id="study-style" value={style} onChange={event => setStyle(event.target.value as Preference['style'])}>
          <option value="solo">Mostly solo</option>
          <option value="group">Group study</option>
          <option value="mix">Flexible mix</option>
        </Select>
      </div>
      <Button type="submit" disabled={saving || !subjects.trim()}>{saving ? 'Saving…' : 'Save & match'}</Button>
    </form>
  )
}

export default function MatchesPage() {
  const preferences = usePreferences()
  const updatePreferences = useUpdatePreferences()
  const matches = useMatches(10, Boolean(preferences.data))
  const acceptMatch = useAcceptMatch()

  async function savePreferences(draft: PreferenceDraft) {
    try {
      await updatePreferences.mutateAsync(draft)
      toast.success('Matching preferences saved')
      await matches.refetch()
    } catch (error) {
      toast.error(getApiError(error, 'Unable to save preferences'))
    }
  }

  async function accept(id: string) {
    try {
      await acceptMatch.mutateAsync(id)
      toast.success('Accountability partner accepted')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to accept this match'))
    }
  }

  return (
    <div>
      <PageHeader title="Accountability partners" description="Match with students who overlap on subjects, timezone, preferred study hours, and collaboration style." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" /> Matching preferences</CardTitle>
          <p className="text-sm text-muted-foreground">Better inputs produce more meaningful partner scores.</p>
        </CardHeader>
        <CardContent>
          {preferences.isLoading ? <p className="text-sm text-muted-foreground">Loading preferences…</p> : (
            <PreferencesForm key={preferences.data?.id ?? 'new-preferences'} initial={preferences.data} saving={updatePreferences.isPending} onSave={savePreferences} />
          )}
        </CardContent>
      </Card>

      {matches.isLoading ? <LoadingPanel label="Calculating compatible partners…" /> : null}
      {matches.isError ? <ErrorPanel message={getApiError(matches.error)} onRetry={() => void matches.refetch()} /> : null}
      {preferences.data && matches.data?.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No compatible partners yet" description="Your preferences are ready. More suggestions will appear as other students complete their profiles." />
      ) : null}
      {matches.data?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {matches.data.map(suggestion => (
            <PartnerCard
              key={suggestion.match.id}
              suggestion={suggestion}
              accepting={acceptMatch.isPending && acceptMatch.variables === suggestion.match.id}
              onAccept={() => void accept(suggestion.match.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
