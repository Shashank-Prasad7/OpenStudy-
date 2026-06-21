import { useState, type FormEvent } from 'react'
import { BrainCircuit, CalendarDays, CheckCircle2, Clock3, ShieldAlert, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Select, Textarea } from '@/components/common/FormControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStudyPlan } from '@/hooks/useUser'
import { formatDate } from '@/lib/utils'

export default function AIPlannerPage() {
  const planner = useStudyPlan()
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [topics, setTopics] = useState('')
  const [hours, setHours] = useState(2)
  const [level, setLevel] = useState('intermediate')
  const [constraints, setConstraints] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await planner.mutateAsync({
        exam_name: examName.trim(),
        exam_date: examDate,
        topics: topics.split(/[,\n]/).map(topic => topic.trim()).filter(Boolean),
        hours_per_day: hours,
        current_level: level,
        constraints: constraints.trim() || undefined,
      })
      toast.success('Study plan generated')
    } catch (error) {
      toast.error(getApiError(error, 'Unable to generate the study plan'))
    }
  }

  return (
    <div>
      <PageHeader title="AI study planner" description="Turn an exam date and topic list into a realistic, Pomodoro-friendly daily plan. Groq is an enhancement—not the core of the platform." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Plan your preparation</CardTitle>
          <p className="text-sm text-muted-foreground">Be specific about topics and practical limitations.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exam-name">Exam or milestone</Label>
              <Input id="exam-name" value={examName} onChange={event => setExamName(event.target.value)} placeholder="Java end-semester exam" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-date">Exam date</Label>
              <Input id="exam-date" type="date" min={new Date().toISOString().slice(0, 10)} value={examDate} onChange={event => setExamDate(event.target.value)} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="topics">Topics</Label>
              <Textarea id="topics" value={topics} onChange={event => setTopics(event.target.value)} placeholder={'OOP fundamentals\nInheritance and polymorphism\nCollections\nException handling'} required />
              <p className="text-xs text-muted-foreground">Separate topics with commas or new lines.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Hours available per day</Label>
              <Input id="hours" type="number" min={0.5} max={12} step={0.5} value={hours} onChange={event => setHours(Number(event.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">Current level</Label>
              <Select id="level" value={level} onChange={event => setLevel(event.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="constraints">Constraints (optional)</Label>
              <Textarea id="constraints" value={constraints} onChange={event => setConstraints(event.target.value)} placeholder="College from 9 AM to 4 PM, free after 6 PM, Sunday reserved for revision." />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" disabled={planner.isPending || !examName.trim() || !examDate || !topics.trim()}>
                <Sparkles className="h-4 w-4" /> {planner.isPending ? 'Generating plan…' : 'Generate study plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {planner.data ? (
        <div className="mt-6 space-y-6">
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge className="mb-3">Generated plan</Badge>
                  <CardTitle className="text-2xl">{planner.data.exam_name}</CardTitle>
                </div>
                <Badge variant="outline"><CalendarDays className="mr-1 h-3 w-3" /> {planner.data.plan.length} days</Badge>
              </div>
            </CardHeader>
            <CardContent><p className="leading-7 text-muted-foreground">{planner.data.overview}</p></CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {planner.data.plan.map(day => (
              <Card key={`${day.day}-${day.date}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Day {day.day}</p>
                      <CardTitle className="mt-2">{day.focus}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(day.date)}</p>
                    </div>
                    <Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" /> {day.pomodoros} blocks</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {day.tasks.map(task => <li key={task} className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> {task}</li>)}
                  </ul>
                  <div className="mt-4 rounded-2xl bg-primary/10 p-4 text-sm"><span className="font-semibold text-primary">Checkpoint:</span> {day.checkpoint}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revision strategy</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {planner.data.revision_strategy.map(item => <p key={item} className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" /> {item}</p>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-400" /> Risks to watch</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {planner.data.risk_flags.length ? planner.data.risk_flags.map(item => <p key={item} className="text-sm leading-6 text-muted-foreground">• {item}</p>) : <p className="text-sm text-muted-foreground">No major risks identified.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
