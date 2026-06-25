import {
  BookOpen,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIStudyPlannerResponse } from '@/types'

interface Props {
  plan: AIStudyPlannerResponse
  onSave: () => void
  onRegenerate: () => void
  onExportPdf: () => void
  onExportMarkdown: () => void
  isSaving: boolean
}

function SectionCard({
  icon,
  title,
  children,
  accent = 'primary',
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <Card className="glass border-white/[0.06] transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className={`grid h-8 w-8 place-items-center rounded-lg bg-${accent}/15 text-${accent}`}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function BulletList({ items, icon }: { items: string[]; icon?: React.ReactNode }) {
  const Icon = icon ?? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
          {Icon}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function StudyPlanResult({
  plan,
  onSave,
  onRegenerate,
  onExportPdf,
  onExportMarkdown,
  isSaving,
}: Props) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
      {/* Header card */}
      <Card className="glass border-primary/20 shadow-2xl shadow-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 gradient-brand border-0 text-white shadow-md shadow-primary/20">
                <Sparkles className="mr-1 h-3 w-3" /> AI-Generated Roadmap
              </Badge>
              <CardTitle className="text-2xl font-black tracking-tight">{plan.overview}</CardTitle>
              {plan.estimatedDuration && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4 text-primary" /> Duration: {plan.estimatedDuration}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> {isSaving ? 'Saving…' : 'Save Plan'}
              </Button>
              <Button variant="outline" size="sm" onClick={onExportPdf} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onExportMarkdown} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Export Markdown
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Assessment */}
      {plan.assessment && (
        <SectionCard icon={<BrainCircuit className="h-4 w-4" />} title="Assessment">
          <p className="text-sm leading-7 text-muted-foreground">{plan.assessment}</p>
        </SectionCard>
      )}

      {/* Learning Phases */}
      {plan.phases.length > 0 && (
        <SectionCard icon={<Lightbulb className="h-4 w-4" />} title="Learning Phases">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plan.phases.map((phase, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:bg-white/[0.04]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Phase {i + 1}</p>
                  <Badge variant="outline" className="text-[10px]">{phase.duration}</Badge>
                </div>
                <h4 className="font-semibold">{phase.title}</h4>
                <ul className="mt-3 space-y-1.5">
                  {phase.topics.map((topic, j) => (
                    <li key={j} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Two-column grid for plans */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Roadmap */}
        {plan.weeklyPlan.length > 0 && (
          <SectionCard icon={<CalendarCheck className="h-4 w-4" />} title="Weekly Roadmap">
            <BulletList items={plan.weeklyPlan} />
          </SectionCard>
        )}

        {/* Daily Routine */}
        {plan.dailyRoutine.length > 0 && (
          <SectionCard icon={<Clock3 className="h-4 w-4" />} title="Daily Routine">
            <BulletList items={plan.dailyRoutine} />
          </SectionCard>
        )}

        {/* Practice Strategy */}
        {plan.practiceStrategy.length > 0 && (
          <SectionCard icon={<Target className="h-4 w-4" />} title="Practice Strategy">
            <BulletList items={plan.practiceStrategy} />
          </SectionCard>
        )}

        {/* Revision Strategy */}
        {plan.revisionStrategy.length > 0 && (
          <SectionCard icon={<RotateCcw className="h-4 w-4" />} title="Revision Strategy">
            <BulletList items={plan.revisionStrategy} />
          </SectionCard>
        )}
      </div>

      {/* Milestones */}
      {plan.milestones.length > 0 && (
        <SectionCard icon={<Trophy className="h-4 w-4" />} title="Milestones">
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground">{m}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Two more sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resources */}
        {plan.resources.length > 0 && (
          <SectionCard icon={<BookOpen className="h-4 w-4" />} title="Recommended Resources">
            <BulletList items={plan.resources} icon={<BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />} />
          </SectionCard>
        )}

        {/* Exam Tips */}
        {plan.examTips.length > 0 && (
          <SectionCard icon={<ListChecks className="h-4 w-4" />} title="Exam Tips">
            <BulletList items={plan.examTips} icon={<Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />} />
          </SectionCard>
        )}
      </div>
    </div>
  )
}
