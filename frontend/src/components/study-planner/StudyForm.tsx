import { useState, type FormEvent } from 'react'
import {
  BrainCircuit,
  CalendarDays,
  Clock3,
  GraduationCap,
  Layers,
  Sparkles,
  StickyNote,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, Textarea } from '@/components/common/FormControls'
import type { AIStudyPlannerRequest } from '@/types'

interface Props {
  onSubmit: (data: AIStudyPlannerRequest) => void
  isPending: boolean
}

export default function StudyForm({ onSubmit, isPending }: Props) {
  const [subject, setSubject] = useState('')
  const [exam, setExam] = useState('')
  const [level, setLevel] = useState('intermediate')
  const [hoursPerDay, setHoursPerDay] = useState(3)
  const [examDate, setExamDate] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      subject: subject.trim(),
      exam: exam.trim(),
      level,
      hoursPerDay,
      examDate,
      notes: notes.trim() || undefined,
    })
  }

  const isValid = subject.trim() && exam.trim() && examDate

  return (
    <Card className="glass border-white/[0.08] shadow-2xl shadow-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand shadow-lg shadow-primary/20">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          Describe Your Study Plan
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in the details below and our AI will craft a personalized roadmap for you.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="ai-subject" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5" /> Subject / Topic
            </Label>
            <Input
              id="ai-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Data Structures and Algorithms"
              required
            />
          </div>

          {/* Exam / Goal */}
          <div className="space-y-2">
            <Label htmlFor="ai-exam" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Exam / Goal
            </Label>
            <Input
              id="ai-exam"
              value={exam}
              onChange={e => setExam(e.target.value)}
              placeholder="e.g. Google SWE Interview"
              required
            />
          </div>

          {/* Current Level */}
          <div className="space-y-2">
            <Label htmlFor="ai-level" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" /> Current Level
            </Label>
            <Select id="ai-level" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>

          {/* Hours Per Day */}
          <div className="space-y-2">
            <Label htmlFor="ai-hours" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" /> Study Hours Per Day
            </Label>
            <Input
              id="ai-hours"
              type="number"
              min={0.5}
              max={16}
              step={0.5}
              value={hoursPerDay}
              onChange={e => setHoursPerDay(Number(e.target.value))}
              required
            />
          </div>

          {/* Exam Date */}
          <div className="space-y-2">
            <Label htmlFor="ai-date" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Target Exam Date
            </Label>
            <Input
              id="ai-date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ai-notes" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <StickyNote className="h-3.5 w-3.5" /> Additional Notes
            </Label>
            <Textarea
              id="ai-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Weak in recursion, need more mock tests, poor at organic chemistry"
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end md:col-span-2">
            <Button
              type="submit"
              disabled={isPending || !isValid}
              className="gap-2 px-6 py-2.5 text-sm font-semibold gradient-brand border-0 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating your personalized roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Roadmap
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
