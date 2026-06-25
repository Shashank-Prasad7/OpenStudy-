import { useCallback, useRef, useState } from 'react'
import { BookmarkCheck, BrainCircuit, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { getApiError } from '@/api/client'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import StudyForm from '@/components/study-planner/StudyForm'
import StudyPlanResult from '@/components/study-planner/StudyPlanResult'
import SavedPlans from '@/components/study-planner/SavedPlans'
import { useGenerateRoadmap, useSavePlan } from '@/hooks/useStudyPlanner'
import type { AIStudyPlannerRequest, AIStudyPlannerResponse, SavedPlan } from '@/types'

type View = 'form' | 'saved'

export default function StudyPlannerPage() {
  const [view, setView] = useState<View>('form')
  const [plan, setPlan] = useState<AIStudyPlannerResponse | null>(null)
  const [lastRequest, setLastRequest] = useState<AIStudyPlannerRequest | null>(null)

  const generateMutation = useGenerateRoadmap()
  const saveMutation = useSavePlan()

  const resultRef = useRef<HTMLDivElement>(null)

  const handleGenerate = useCallback(async (data: AIStudyPlannerRequest) => {
    setLastRequest(data)
    try {
      const result = await generateMutation.mutateAsync(data)
      setPlan(result)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    } catch (err) {
      toast.error(getApiError(err, 'Unable to generate study plan. Please try again.'))
    }
  }, [generateMutation])

  const handleRegenerate = useCallback(() => {
    if (lastRequest) handleGenerate(lastRequest)
  }, [lastRequest, handleGenerate])

  const handleSave = useCallback(async () => {
    if (!plan || !lastRequest) return
    try {
      await saveMutation.mutateAsync({
        subject: lastRequest.subject,
        exam: lastRequest.exam,
        level: lastRequest.level,
        hours_per_day: lastRequest.hoursPerDay,
        exam_date: lastRequest.examDate,
        notes: lastRequest.notes ?? null,
        plan_data: plan,
      })
      toast.success('Study plan saved!')
    } catch (err) {
      toast.error(getApiError(err, 'Failed to save study plan'))
    }
  }, [plan, lastRequest, saveMutation])

  const handleExportPdf = useCallback(() => {
    if (!plan) return
    // Build a styled HTML document for printing as PDF
    const html = buildPdfHtml(plan)
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to download the PDF.')
      return
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }, [plan])

  const handleExportMarkdown = useCallback(() => {
    if (!plan) return
    const md = buildMarkdown(plan)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'study_plan.md'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown exported')
  }, [plan])

  const handleViewSavedPlan = useCallback((data: AIStudyPlannerResponse, meta: SavedPlan) => {
    setPlan(data)
    setLastRequest({
      subject: meta.subject,
      exam: meta.exam,
      level: meta.level,
      hoursPerDay: meta.hours_per_day,
      examDate: meta.exam_date,
      notes: meta.notes ?? undefined,
    })
    setView('form')
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }, [])

  return (
    <div>
      <PageHeader
        title="AI Study Planner"
        description="Generate a personalized, AI-powered study roadmap. Save, export, and manage your plans."
        actions={
          <div className="flex gap-2">
            <Button
              variant={view === 'form' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('form')}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate
            </Button>
            <Button
              variant={view === 'saved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('saved')}
              className="gap-1.5"
            >
              <BookmarkCheck className="h-3.5 w-3.5" /> Saved Plans
            </Button>
          </div>
        }
      />

      {view === 'form' ? (
        <div className="space-y-8">
          <StudyForm onSubmit={handleGenerate} isPending={generateMutation.isPending} />

          {/* Loading skeleton */}
          {generateMutation.isPending && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Generating your personalized roadmap...</span>
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
              <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </div>
            </div>
          )}

          {/* Result */}
          {plan && !generateMutation.isPending && (
            <div ref={resultRef}>
              <StudyPlanResult
                plan={plan}
                onSave={handleSave}
                onRegenerate={handleRegenerate}
                onExportPdf={handleExportPdf}
                onExportMarkdown={handleExportMarkdown}
                isSaving={saveMutation.isPending}
              />
            </div>
          )}
        </div>
      ) : (
        <SavedPlans onViewPlan={handleViewSavedPlan} />
      )}
    </div>
  )
}


// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

function buildMarkdown(plan: AIStudyPlannerResponse): string {
  const lines: string[] = []
  lines.push('# Study Plan\n')

  if (plan.overview) {
    lines.push('## Study Overview\n')
    lines.push(plan.overview + '\n')
  }
  if (plan.estimatedDuration) {
    lines.push(`**Estimated Duration:** ${plan.estimatedDuration}\n`)
  }
  if (plan.assessment) {
    lines.push('## Assessment\n')
    lines.push(plan.assessment + '\n')
  }
  if (plan.phases.length) {
    lines.push('## Learning Phases\n')
    plan.phases.forEach((p, i) => {
      lines.push(`### Phase ${i + 1}: ${p.title} (${p.duration})\n`)
      p.topics.forEach(t => lines.push(`- ${t}`))
      lines.push('')
    })
  }
  if (plan.weeklyPlan.length) {
    lines.push('## Weekly Roadmap\n')
    plan.weeklyPlan.forEach(w => lines.push(`- ${w}`))
    lines.push('')
  }
  if (plan.dailyRoutine.length) {
    lines.push('## Daily Routine\n')
    plan.dailyRoutine.forEach(d => lines.push(`- ${d}`))
    lines.push('')
  }
  if (plan.practiceStrategy.length) {
    lines.push('## Practice Strategy\n')
    plan.practiceStrategy.forEach(p => lines.push(`- ${p}`))
    lines.push('')
  }
  if (plan.revisionStrategy.length) {
    lines.push('## Revision Strategy\n')
    plan.revisionStrategy.forEach(r => lines.push(`- ${r}`))
    lines.push('')
  }
  if (plan.milestones.length) {
    lines.push('## Milestones\n')
    plan.milestones.forEach((m, i) => lines.push(`${i + 1}. ${m}`))
    lines.push('')
  }
  if (plan.resources.length) {
    lines.push('## Recommended Resources\n')
    plan.resources.forEach(r => lines.push(`- ${r}`))
    lines.push('')
  }
  if (plan.examTips.length) {
    lines.push('## Exam Tips\n')
    plan.examTips.forEach(t => lines.push(`- ${t}`))
    lines.push('')
  }

  return lines.join('\n')
}

function buildPdfHtml(plan: AIStudyPlannerResponse): string {
  const md = buildMarkdown(plan)
  // Convert markdown to simple HTML
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p><strong>$1</strong></p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '\n')

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/((?:<li>.+<\/li>\n?)+)/g, '<ul>$1</ul>')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Study Plan</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a2e; line-height: 1.7; }
  h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 0.5rem; }
  h2 { color: #4f46e5; margin-top: 2rem; }
  h3 { color: #6366f1; margin-top: 1.5rem; }
  ul { padding-left: 1.5rem; }
  li { margin-bottom: 0.4rem; }
  @media print { body { font-size: 11pt; } }
</style>
</head>
<body>${html}</body>
</html>`
}
